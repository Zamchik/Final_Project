import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');
    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password_hash, role: 'buyer' },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');
    return { id: user.id, email: user.email, role: user.role };
  }

  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return { id: user.id, email: user.email, role: user.role, balance: user.balance };
  }

   // Cменить пароль пользователя.
   // Проверяет старый пароль, хеширует новый и сохраняет.
  async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Пользователь не найден');

    // Проверяем старый пароль
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) throw new Error('Неверный текущий пароль');

    // Хешируем новый пароль и сохраняем
    const newHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password_hash: newHash },
    });

    return { success: true };
  }
}