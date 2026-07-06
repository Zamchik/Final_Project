import { AuthService } from '../services/auth.service';
import { prisma } from '../prisma';
import bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    authService = new AuthService(prisma);
  });

  afterEach(async () => {
    // Очищаем тестового пользователя
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
  });

  it('должен зарегистрировать нового пользователя', async () => {
    const user = await authService.register('test@example.com', 'password123');
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('buyer');

    // Проверяем, что пароль захэширован
    const dbUser = await prisma.user.findUnique({ where: { email: 'test@example.com' } });
    const isPasswordValid = await bcrypt.compare('password123', dbUser!.passwordHash);
    expect(isPasswordValid).toBe(true);
  });

  it('должен выбросить ошибку при повторной регистрации', async () => {
    await authService.register('test@example.com', 'password123');
    await expect(authService.register('test@example.com', 'password123'))
      .rejects.toThrow('Email already registered');
  });

  it('должен успешно авторизовать пользователя', async () => {
    await authService.register('test@example.com', 'password123');
    const user = await authService.login('test@example.com', 'password123');
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });

  it('должен выбросить ошибку при неверном пароле', async () => {
    await authService.register('test@example.com', 'password123');
    await expect(authService.login('test@example.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password');
  });
});