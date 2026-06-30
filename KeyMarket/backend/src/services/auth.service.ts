// Сервис аутентификации
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

export class AuthService {
  constructor(private prisma: PrismaClient) { }

  // Регистрация нового пользователя
  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');
    const password_hash = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, password_hash, role: 'buyer' },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  // Вход в систему
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');
    return { id: user.id, email: user.email, role: user.role };
  }

  // Получить пользователя по ID
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return { id: user.id, email: user.email, role: user.role, balance: user.balance };
  }

  // Сменить пароль пользователя.
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
  
  // Генерирует JWT-токен для подтверждения email.
   // Токен действителен 24 часа.
  async generateVerificationToken(userId: number) {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'supersecretkey', { expiresIn: '24h' });
}

   // Проверяет токен подтверждения email и активирует пользователя.
   // Возвращает true, если токен валиден и пользователь активирован.
  async verifyEmail(token: string) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey') as { userId: number };
    await this.prisma.user.update({
      where: { id: payload.userId },
      data: { email_verified: true },
    });
    return true;
  } catch {
    return false;
  }
}
}