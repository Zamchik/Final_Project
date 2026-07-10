// Контроллер аутентификации
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../common/errors';
import { NotificationType } from '@prisma/client';

export class AuthController {
  constructor(private authService: AuthService) { }

  // POST /auth/register — регистрация нового пользователя.
  // Письмо отправляется асинхронно, previewUrl формируется мгновенно.
  register = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.register(email, password);

    // Генерируем токен и ссылку для подтверждения
    const token = await this.authService.generateVerificationToken(user.id);
    const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
    const verificationUrl = `${appBaseUrl}/auth/verify-email?token=${token}`;

    // previewUrl сразу (общий ящик, не ждём отправки)
    const previewUrl = process.env.SMTP_USER
      ? 'https://ethereal.email/messages'
      : null;

    // Отправляем письмо асинхронно, ошибка не влияет на ответ
    req.server.emailService.send(
      email,
      'Подтвердите регистрацию в KeyMarket',
      `<h1>Добро пожаловать, ${email}!</h1>
       <p>Вы успешно зарегистрировались на платформе KeyMarket.</p>
       <p>Для активации аккаунта перейдите по ссылке:</p>
       <a href="${verificationUrl}">${verificationUrl}</a>`
    ).catch(mailErr => req.server.log.error(`Ошибка отправки письма подтверждения: ${(mailErr as Error).message}`));

    // Приветственное уведомление – тоже асинхронно
    req.server.notificationService.create(
      user.id,
      NotificationType.WELCOME,
      'Добро пожаловать в KeyMarket!'
    ).catch(err => req.server.log.error('Ошибка создания уведомления:', err));

    reply.status(201).send({
      message: 'Регистрация успешна. Проверьте почту для подтверждения.',
      verificationUrl,
      previewUrl,   // всегда строка или null
    });
  };

  // POST /auth/login — вход в систему.
  login = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.login(email, password);

    if (!user.verifiedAt) {
      throw new ForbiddenError('Email not verified');
    }
    if (user.bannedAt) {
      throw new ForbiddenError('Ваш аккаунт заблокирован');
    }

    req.session.set('user', { id: user.id, email: user.email, role: user.role });
    return { user: user };
  };

  // POST /auth/logout — выход из системы.
  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    req.session.set('user', undefined);
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
  verifyEmail = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    const result = await this.authService.verifyEmail(token);
    if (!result) throw new BadRequestError('Invalid or expired token');
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

  // ------------------ Методы для становления продавцом ------------------
  requestSellerRole = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { password } = req.body as any;
    if (!password) throw new BadRequestError('Пароль обязателен');

    const isValid = await this.authService.verifyUserPassword(user.id, password);
    if (!isValid) {
      throw new BadRequestError('Неверный пароль');
    }

    const data = await this.authService.requestSellerRole(user.id, user.email);
    return data;
  };

  confirmSellerRole = async (
    req: FastifyRequest<{ Querystring: { token: string } }>,
    reply: FastifyReply
  ) => {
    const { token } = req.query;
    const updatedUser = await this.authService.confirmSellerRole(token);

    req.session.set('user', {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    reply.redirect(`${frontendUrl}/cabinet?role=SELLER`);
  };
}