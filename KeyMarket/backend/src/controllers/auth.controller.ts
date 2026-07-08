// Контроллер аутентификации
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../common/errors';
import { NotificationType } from '@prisma/client';

export class AuthController {
  constructor(private authService: AuthService) { }

  // POST /auth/register — регистрация нового пользователя.
  // Отправляет письмо и уведомление асинхронно, не задерживая ответ.
  register = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.register(email, password);

    // Генерируем токен и ссылку для подтверждения
    const token = await this.authService.generateVerificationToken(user.id);
    // Базовый URL бэкенда (можно переопределить через APP_BASE_URL)
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const link = `${appBaseUrl}/auth/verify-email?token=${token}`;

    // Отправляем письмо асинхронно, не дожидаясь ответа
    req.server.emailService.send(
      email,
      'Подтвердите регистрацию в KeyMarket',
      `<h1>Добро пожаловать, ${email}!</h1>
       <p>Вы успешно зарегистрировались на платформе KeyMarket.</p>
       <p>Для активации аккаунта перейдите по ссылке:</p>
       <a href="${link}">${link}</a>`
    ).catch(mailErr => req.server.log.error('Ошибка отправки письма подтверждения:', mailErr));

    // Приветственное уведомление тоже отправляем асинхронно
    req.server.notificationService.create(
      user.id,
      NotificationType.WELCOME,
      'Добро пожаловать в KeyMarket!'
    ).catch(err => req.server.log.error('Ошибка создания уведомления:', err));

    // Ответ возвращается немедленно, без ожидания почты и уведомлений
    reply.status(201).send({
      message: 'Регистрация успешна. Проверьте почту для подтверждения.',
      verificationUrl: link,
    });
  };

  // POST /auth/login — вход в систему.
  // Проверяет подтверждение email и отсутствие бана.
  login = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.login(email, password);

    // Проверяем, подтверждён ли email
    if (!user.verifiedAt) {
      throw new ForbiddenError('Email not verified');
    }
    // Если пользователь забанен, не даём войти
    if (user.bannedAt) {
      throw new ForbiddenError('Ваш аккаунт заблокирован');
    }

    req.session.set('user', { id: user.id, email: user.email, role: user.role });
    return { user: user };
  };

  // POST /auth/logout — выход из системы.
  logout = async (req: FastifyRequest, reply: FastifyReply) => {
  req.session.set('user', undefined);
  // Принудительно удаляем куку на клиенте
  reply.clearCookie('session', { path: '/' });
  return {};
};

  // GET /auth/me — получить данные текущего пользователя
  getMe = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.authService.getUserById(userId);
  };

  // POST /auth/change-password — смена пароля.
  changePassword = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { oldPassword, newPassword } = req.body as any;
    return this.authService.changePassword(userId, oldPassword, newPassword);
  };

  // GET /auth/verify-email — подтверждение email по токену.
  // Перенаправляет на фронтенд с сообщением об успехе.
  verifyEmail = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    const result = await this.authService.verifyEmail(token);
    if (!result) throw new BadRequestError('Invalid or expired token');
    // URL фронтенда для редиректа
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    reply.redirect(`${frontendUrl}/login?verified=true`);
  };

  // POST /auth/resend-verification — повторно отправить письмо для подтверждения.
  resendVerification = async (
    req: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ) => {
    const { email } = req.body;
    const data = await this.authService.resendVerification(email);
    return data; // { verificationUrl, previewUrl }
  };

  // ================== Новые методы для становления продавцом ==================

  /**
   * POST /auth/request-seller-role — запрос на получение роли продавца.
   * Требует пароль для подтверждения личности, затем отправляет ссылку на email.
   */
  requestSellerRole = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { password } = req.body as any;
    if (!password) throw new BadRequestError('Пароль обязателен');

    // Проверяем пароль через новый метод сервиса
    const isValid = await this.authService.verifyUserPassword(user.id, password);
    if (!isValid) {
      throw new BadRequestError('Неверный пароль');
    }

    // Отправляем письмо с токеном подтверждения роли продавца
    const data = await this.authService.requestSellerRole(user.id, user.email);
    return data;
  };

  /**
   * GET /auth/confirm-seller-role — подтверждение роли продавца по JWT-токену.
   * После успешной проверки обновляет роль в базе и сессии, редиректит в кабинет.
   */
  confirmSellerRole = async (
    req: FastifyRequest<{ Querystring: { token: string } }>,
    reply: FastifyReply
  ) => {
    const { token } = req.query;
    const updatedUser = await this.authService.confirmSellerRole(token);

    // Обновляем сессию — теперь пользователь SELLER
    req.session.set('user', {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    // Редирект на фронтенд в кабинет с параметром role=SELLER
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    reply.redirect(`${frontendUrl}/cabinet?role=SELLER`);
  };
}