// Сервис аутентификации
import jwt from 'jsonwebtoken';
import { PrismaClient, UserRole } from '@prisma/client';
import { scryptSync, randomBytes, timingSafeEqual } from 'crypto';
import { ConflictError, UnauthorizedError, NotFoundError, BadRequestError } from '../common/errors';

// Хеширует пароль с солью (scrypt).
// Возвращает строку вида salt:hash для хранения в БД.
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
  constructor(private prisma: PrismaClient) { }

  // Регистрация нового пользователя
  async register(email: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictError('Email already registered');
    const passwordHash = hashPassword(password);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,          // поле маппится на password_hash
        role: UserRole.BUYER,  // enum значение
      },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  // Вход в систему
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedError('Invalid email or password');
    if (!verifyPassword(password, user.passwordHash)) throw new UnauthorizedError('Invalid email or password');
    return { id: user.id, email: user.email, role: user.role };
  }

  // Получить пользователя по ID
  async getUserById(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundError('User not found');
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      balance: user.balance, // Decimal, фронтенд сам преобразует
    };
  }

  // Сменить пароль пользователя
    async changePassword(userId: number, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');

    // Проверяем старый пароль
    if (!verifyPassword(oldPassword, user.passwordHash)) {
      throw new BadRequestError('Неверный текущий пароль');
    }
    
    // Хешируем и сохраняем новый пароль
    const newHash = hashPassword(newPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    return { success: true };
  }

  // Генерирует JWT-токен для подтверждения email (действителен 24 часа)
  async generateVerificationToken(userId: number) {
    return jwt.sign({ userId }, process.env.JWT_SECRET || 'supersecretkey', {
      expiresIn: '24h',
    });
  }

  // Проверяет токен подтверждения email и активирует пользователя.
  async verifyEmail(token: string) {
    try {
      const payload = jwt.verify(
        token,
        process.env.JWT_SECRET || 'supersecretkey'
      ) as { userId: number };
      await this.prisma.user.update({
        where: { id: payload.userId },
        data: { verifiedAt: new Date() }, // поле даты верификации
      });
      return true;
    } catch {
      return false;
    }
  }
}