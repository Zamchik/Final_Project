// Проверяют регистрацию, вход, смену пароля и обработку ошибок.
import { AuthService } from '../services/auth.service';
import { prisma } from '../prisma';
import { EmailService } from '../services/email.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeAll(() => {
    // Создаём экземпляр сервиса с реальной Prisma и замоканным EmailService
    const emailService = { send: jest.fn() } as any;
    authService = new AuthService(prisma, emailService);
  });

  afterEach(async () => {
    // Очищаем тестового пользователя после каждого теста
    await prisma.user.deleteMany({ where: { email: 'test@example.com' } });
  });

  // Тест успешной регистрации
  it('должен зарегистрировать нового пользователя', async () => {
    const user = await authService.register('test@example.com', 'password123');
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('BUYER');
  });

  // Тест повторной регистрации
  it('должен выбросить ошибку при повторной регистрации', async () => {
    await authService.register('test@example.com', 'password123');
    await expect(authService.register('test@example.com', 'password123'))
      .rejects.toThrow('Email already registered');
  });

  // Тест успешного входа
  it('должен успешно авторизовать пользователя', async () => {
    await authService.register('test@example.com', 'password123');
    const user = await authService.login('test@example.com', 'password123');
    expect(user).toHaveProperty('id');
    expect(user.email).toBe('test@example.com');
  });

  // Тест входа с неверным паролем
  it('должен выбросить ошибку при неверном пароле', async () => {
    await authService.register('test@example.com', 'password123');
    await expect(authService.login('test@example.com', 'wrongpassword'))
      .rejects.toThrow('Invalid email or password');
  });

  // Тест смены пароля
  it('должен сменить пароль пользователя', async () => {
    const user = await authService.register('test@example.com', 'password123');
    // Пытаемся залогиниться со старым паролем – должно работать
    await authService.login('test@example.com', 'password123');
    await authService.changePassword(user.id, 'password123', 'newpassword123');
    // После смены старый пароль не должен работать
    await expect(authService.login('test@example.com', 'password123'))
      .rejects.toThrow('Invalid email or password');
    // Новый пароль должен работать
    const loggedIn = await authService.login('test@example.com', 'newpassword123');
    expect(loggedIn.email).toBe('test@example.com');
  });
});