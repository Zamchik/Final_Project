// Сервис аутентификации
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../common/errors';
import { EmailService } from '../services/email.service';   // импорт почтового сервиса
import nodemailer from 'nodemailer';                         // нужен для getTestMessageUrl

// Хеширует пароль с солью (scrypt).
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Проверяет пароль по сохранённой строке salt:hash
function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const hashed = scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(hash, 'hex');
  return timingSafeEqual(hashed, storedBuf);
}

export class AuthService {
  // Теперь принимаем EmailService вторым параметром
  constructor(
    private prisma: PrismaClient,
    private emailService: EmailService
  ) { }

  // Регистрация нового пользователя (без изменений)
  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');
    const passwordHash = hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.BUYER,
      },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  // Вход в систему (без изменений)
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!verifyPassword(password, user.passwordHash))
      throw new UnauthorizedError('Invalid email or password');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      verifiedAt: user.verifiedAt,
    };
  }

  // Получить пользователя по ID (без изменений)
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance,
    };
  }

  // Сменить пароль пользователя (без изменений)
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (!verifyPassword(oldPassword, user.passwordHash)) {
      throw new BadRequestError('Неверный текущий пароль');
    }
    const newHash = hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
    return { success: true };
  }

  // Генерирует JWT-токен для подтверждения email (без изменений)
  async generateVerificationToken(userId: number) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'supersecretkey', {
      expiresIn: '24h',
    });
  }

  // Проверяет токен подтверждения email и активирует пользователя (без изменений)
  async verifyEmail(token: string) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { verifiedAt: new Date() },
      });
      return true;
    } catch {
      return false;
    }
  }

  // Повторная отправка ссылки для верификации email
  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundError('User not found');
    if (user.verifiedAt) throw new BadRequestError('Email already verified');

    const token = await this.generateVerificationToken(user.id);
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;

    let previewUrl: string | null = null;
    try {
      const info = await this.emailService.send(
        email,
        'Подтвердите регистрацию в KeyMarket',
        `<h1>Подтверждение email</h1><p>Перейдите по ссылке: <a href="${link}">${link}</a></p>`
      );
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      if (!previewUrl && (info as any).messageId) {
        previewUrl = `https://ethereal.email/message/${(info as any).messageId}`;
      }
    } catch (err) {
      // ошибка отправки не прерывает операцию
    }

    return { verificationUrl: link, previewUrl };
  }
}