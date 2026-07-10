// Сервис аутентификации
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../common/errors';
import { EmailService } from '../services/email.service';
import nodemailer from 'nodemailer';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashed = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(hashed, storedBuf);
}

export class AuthService {
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) { }

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');
    const passwordHash = hashPassword(password);
    const user = await this.prisma.user.create({
      data: { email, passwordHash, role: UserRole.BUYER },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!verifyPassword(password, user.passwordHash))
      throw new UnauthorizedError('Invalid email or password');
    return {
      id: user.id, email: user.email, role: user.role,
      verifiedAt: user.verifiedAt, bannedAt: user.bannedAt,
    };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return { id: user.id, email: user.email, role: user.role, balance: user.balance };
  }

  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (!verifyPassword(oldPassword, user.passwordHash))
      throw new BadRequestError('Неверный текущий пароль');
    const newHash = hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });
    return { success: true };
  }

  async generateVerificationToken(userId: number) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '24h' });
  }

  async verifyEmail(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
      await this.prisma.user.update({ where: { id: payload.userId }, data: { verifiedAt: new Date() } });
      return true;
    } catch { return false; }
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError('User not found');
    if (user.verifiedAt) throw new BadRequestError('Email already verified');

    const token = await this.generateVerificationToken(user.id);
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;
    let previewUrl: string | null = null;
    try {
      const info = await this.emailService.send(
        email, 'Подтвердите регистрацию в KeyMarket',
        `<h1>Подтверждение email</h1><p>Перейдите по ссылке: <a href="${link}">${link}</a></p>`
      );
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      if (!previewUrl && (info as any).messageId)
        previewUrl = `https://ethereal.email/message/${(info as any).messageId}`;
    } catch (err) { }
    return { verificationUrl: link, previewUrl };
  }

  // ---------- Продавец ----------
  async verifyUserPassword(userId: number, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    return verifyPassword(password, user.passwordHash);
  }

  async generateSellerRoleToken(userId: number): Promise<string> {
    return jwt.sign({ userId, type: 'seller_role' },
      process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '1h' });
  }

  async requestSellerRole(userId: number, email: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (user.role !== UserRole.BUYER)
      throw new ConflictError('Вы уже являетесь продавцом или администратором');

    const token = await this.generateSellerRoleToken(userId);
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const link = `${appBaseUrl}/auth/confirm-seller-role?token=${token}`;
    let previewUrl: string | null = null;
    try {
      const info = await this.emailService.send(
        email, 'Подтверждение статуса продавца в KeyMarket',
        `<h1>Стать продавцом</h1><p>Для активации статуса продавца перейдите по ссылке:</p><a href="${link}">${link}</a><p>Ссылка действительна 1 час.</p>`
      );
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      if (!previewUrl && (info as any).messageId)
        previewUrl = `https://ethereal.email/message/${(info as any).messageId}`;
    } catch (err) { }
    return { verificationUrl: link, previewUrl };
  }

  async confirmSellerRole(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number; type: string };
      if (payload.type !== 'seller_role') throw new BadRequestError('Неверный тип токена');
      const user = await this.prisma.user.update({
        where: { id: payload.userId },
        data: { role: UserRole.SELLER },
        select: { id: true, email: true, role: true },
      });
      return user;
    } catch (err) {
      if (err instanceof jwt.JsonWebTokenError) throw new BadRequestError('Недействительный или просроченный токен');
      throw err;
    }
  }

  // ---------- Восстановление пароля ----------
  async forgotPassword(email: string): Promise<{ resetUrl: string; previewUrl: string | null } | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;

    const token = jwt.sign(
      { userId: user.id, type: 'reset_password' },
      process.env.JWT_SECRET || 'supersecretkey',
      { expiresIn: '1h' }
    );
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    let previewUrl: string | null = null;
    try {
      const info = await this.emailService.send(
        email, 'Восстановление пароля KeyMarket',
        `<h1>Сброс пароля</h1><p>Перейдите по ссылке: <a href="${resetUrl}">${resetUrl}</a></p><p>Ссылка действительна 1 час.</p>`
      );
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      if (!previewUrl && (info as any).messageId)
        previewUrl = `https://ethereal.email/message/${(info as any).messageId}`;
    } catch (err) { }

    return { resetUrl, previewUrl };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: { userId: number; type: string };
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number; type: string };
      if (payload.type !== 'reset_password') throw new BadRequestError('Неверный тип токена');
    } catch {
      throw new BadRequestError('Токен недействителен или истёк');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');

    const newHash = hashPassword(newPassword);
    await this.prisma.user.update({ where: { id: payload.userId }, data: { passwordHash: newHash } });
  }
}