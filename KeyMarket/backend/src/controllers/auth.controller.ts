// ============================================================================
// Контроллер аутентификации
// Обрабатывает регистрацию, вход, получение профиля, выход, смену пароля и подтверждение email
// ============================================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

interface AuthBody {
  email: string;
  password: string;
}

export class AuthController {
  constructor(private authService: AuthService) { }

  /**
   * POST /auth/register — регистрация нового пользователя
   * После успешной регистрации отправляет письмо с подтверждением email.
   * Сессия НЕ создаётся до подтверждения.
   */
  register = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);

      // Генерируем токен подтверждения email
      const token = await this.authService.generateVerificationToken(user.id);
      const link = `http://localhost:3000/auth/verify-email?token=${token}`;

      // Отправляем письмо с подтверждением
      try {
        await req.server.emailService.send(
          email,
          'Подтвердите регистрацию в KeyMarket',
          `<h1>Добро пожаловать, ${email}!</h1>
           <p>Вы успешно зарегистрировались на платформе KeyMarket.</p>
           <p>Для активации аккаунта перейдите по ссылке:</p>
           <a href="${link}">${link}</a>`
        );
      } catch (mailErr) {
        console.error('Ошибка отправки письма подтверждения:', mailErr);
      }

      // Создаём in-app уведомление о регистрации
      try {
        await req.server.notificationService.create(user.id, 'welcome', 'Добро пожаловать в KeyMarket!');
      } catch (err) {
        console.error('Ошибка создания уведомления:', err);
      }

      return { message: 'Регистрация успешна. Проверьте почту для подтверждения.' };
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

  /**
   * GET /auth/verify-email — подтверждение email по токену
   */
  verifyEmail = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    const success = await this.authService.verifyEmail(token);
    if (success) {
      reply.redirect('http://localhost:5173/login?verified=true');
    } else {
      reply.status(400).send({ error: 'Неверная или просроченная ссылка подтверждения' });
    }
  };

  /**
   * POST /auth/login — вход в систему
   */
  login = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.login(email, password);
      req.session.set('user', user);
      return { user };
    } catch (err) {
      reply.status(401).send({ error: (err as Error).message });
    }
  };

  /**
   * GET /auth/me — получить данные текущего пользователя
   */
  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const fullUser = await this.authService.getUserById(user.id);
    return fullUser;
  };

  /**
   * POST /auth/logout — выход из системы
   */
  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    req.session.delete();
    return { success: true };
  };

  /**
   * POST /auth/change-password — смена пароля
   */
  changePassword = async (req: FastifyRequest<{ Body: { oldPassword: string; newPassword: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const result = await this.authService.changePassword(userId, req.body.oldPassword, req.body.newPassword);
      return result;
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };
}