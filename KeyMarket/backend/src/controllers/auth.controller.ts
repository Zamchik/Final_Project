// Контроллер аутентификации
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../common/errors';
import { NotificationType } from '@prisma/client';
import nodemailer from 'nodemailer'; // импорт для getTestMessageUrl

export class AuthController {
  constructor(private authService: AuthService) { }

  register = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.register(email, password);

    // Генерируем токен и ссылку для подтверждения
    const token = await this.authService.generateVerificationToken(user.id);
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;

    let previewUrl: string | null = null;
    try {
      const info = await req.server.emailService.send(
        email,
        'Подтвердите регистрацию в KeyMarket',
        `<h1>Добро пожаловать, ${email}!</h1>
         <p>Вы успешно зарегистрировались на платформе KeyMarket.</p>
         <p>Для активации аккаунта перейдите по ссылке:</p>
         <a href="${link}">${link}</a>`
      );
      previewUrl = nodemailer.getTestMessageUrl(info) || null;
      // Ручное формирование ссылки, если getTestMessageUrl не сработал
      if (!previewUrl && (info as any).messageId) {
        previewUrl = `https://ethereal.email/message/${(info as any).messageId}`;
      }
    } catch (mailErr) {
      req.server.log.error(mailErr);
    }

    // Приветственное уведомление
    try {
      await req.server.notificationService.create(user.id, NotificationType.WELCOME, 'Добро пожаловать в KeyMarket!');
    } catch (err) {
      req.server.log.error(err);
    }

    reply.status(201).send({
      message: 'Регистрация успешна. Проверьте почту для подтверждения.',
      verificationUrl: link,
      previewUrl,
    });
  };

  // POST /auth/login — вход
  login = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.login(email, password);

    // Проверяем, подтверждён ли email
    if (!user.verifiedAt) {
      throw new ForbiddenError('Email not verified');
    }
    // если пользователь забанен, не даём войти
    if (user.bannedAt) {
      throw new ForbiddenError('Ваш аккаунт заблокирован');
    }

    req.session.set('user', { id: user.id, email: user.email, role: user.role });
    return { user: user };
  };

  // POST /auth/logout — выход
  logout = async (req: FastifyRequest) => {
    req.session.delete(); // удаляем сессию
    return {};
  };

  // GET /auth/me — профиль текущего пользователя
  getMe = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.authService.getUserById(userId);
  };

  // POST /auth/change-password — смена пароля
  changePassword = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { oldPassword, newPassword } = req.body as any;
    return this.authService.changePassword(userId, oldPassword, newPassword);
  };

  // GET /auth/verify-email — подтверждение email
  verifyEmail = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    const result = await this.authService.verifyEmail(token);
    if (!result) throw new BadRequestError('Invalid or expired token');
    // После успешного подтверждения перенаправляем на фронтенд
    reply.redirect('http://localhost:5173/login?verified=true');
  };

  // POST /auth/resend-verification — повторно отправить письмо для подтверждения email
  resendVerification = async (
    req: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ) => {
    const { email } = req.body;
    // Все ошибки (неверный email, уже подтверждён) обработаются глобальным хендлером
    const data = await this.authService.resendVerification(email);
    return data; // { verificationUrl, previewUrl }
  };
}