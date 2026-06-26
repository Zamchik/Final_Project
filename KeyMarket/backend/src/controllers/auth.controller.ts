// ============================================================================
// Контроллер аутентификации
// ============================================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

interface AuthBody {
  email: string;
  password: string;
}

export class AuthController {
  constructor(private authService: AuthService) { }

  register = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);

      // Сохраняем пользователя в сессии
      req.session.set('user', user);

      // Создаём in-app уведомление
      try {
        await req.server.notificationService.create(user.id, 'welcome', 'Добро пожаловать в KeyMarket!');
      } catch (err) {
        console.error('Ошибка создания уведомления:', err);
      }

      // Отправляем приветственное письмо (emailService доступен через декоратор Fastify)
      try {
        await req.server.emailService.send(
          email,
          'Добро пожаловать в KeyMarket!',
          `<h1>Приветствуем, ${email}!</h1><p>Вы успешно зарегистрировались на платформе KeyMarket.</p>`
        );
      } catch (mailErr) {
        // Ошибка отправки письма не должна ломать регистрацию
        console.error('Ошибка отправки приветственного письма:', mailErr);
      }

      return { user };
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

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

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const fullUser = await this.authService.getUserById(user.id);
    return fullUser;
  };

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    req.session.delete();
    return { success: true };
  };
}