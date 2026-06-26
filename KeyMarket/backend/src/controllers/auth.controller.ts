// Контроллер аутентификации
// Обрабатывает регистрацию, вход, получение профиля и выход
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

interface AuthBody {
  email: string;
  password: string;
}

export class AuthController {
  constructor(private authService: AuthService) { }

   // POST /auth/register — регистрация нового пользователя
  register = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);

      // Сохраняем пользователя в сессии
      req.session.set('user', user);

      // Создаём in-app уведомление о регистрации
      try {
        await req.server.notificationService.create(user.id, 'welcome', 'Добро пожаловать в KeyMarket!');
      } catch (err) {
        console.error('Ошибка создания уведомления:', err);
      }

      // Отправляем приветственное письмо на email
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

   // POST /auth/login — вход в систему
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

   // GET /auth/me — получить данные текущего пользователя
  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const fullUser = await this.authService.getUserById(user.id);
    return fullUser;
  };

   // POST /auth/logout — выход из системы
  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    req.session.delete();
    return { success: true };
  };
}