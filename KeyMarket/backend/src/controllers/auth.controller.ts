// Контроллер аутентификации
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';
import { UnauthorizedError, BadRequestError } from '../common/errors';

export class AuthController {
  constructor(private authService: AuthService) { }

  // POST /auth/register — регистрация
  register = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.register(email, password);

    // Генерируем токен подтверждения и ссылку
    const token = await this.authService.generateVerificationToken(user.id);
    const link = `http://localhost:3000/auth/verify-email?token=${token}`;

    // Пытаемся отправить письмо – ошибка не должна ломать регистрацию
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
      // логирование можно добавить позже через fastify.log
    }

    // Создаём приветственное уведомление
    try {
      await req.server.notificationService.create(user.id, 'welcome', 'Добро пожаловать в KeyMarket!');
    } catch (err) {
      // игнорируем ошибку
    }

    reply.status(201).send({ message: 'Регистрация успешна. Проверьте почту для подтверждения.' });
  };

  // POST /auth/login — вход
  login = async (req: FastifyRequest<{ Body: { email: string; password: string } }>, reply: FastifyReply) => {
    const { email, password } = req.body;
    const user = await this.authService.login(email, password);
    req.session.set('user', { id: user.id, email: user.email, role: user.role });
    return user;
  };

  // POST /auth/logout — выход
  logout = async (req: FastifyRequest) => {
    (req.session as any).destroy();
    return { success: true };
  };

  // GET /auth/me — профиль текущего пользователя
  getMe = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.authService.getUserById(userId);
  };

  // POST /auth/change-password — смена пароля
  changePassword = async (req: FastifyRequest<{ Body: { oldPassword: string; newPassword: string } }>) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.authService.changePassword(userId, req.body.oldPassword, req.body.newPassword);
  };

  // GET /auth/verify-email — подтверждение email
  verifyEmail = async (req: FastifyRequest<{ Querystring: { token: string } }>, reply: FastifyReply) => {
    const { token } = req.query;
    const result = await this.authService.verifyEmail(token);
    if (!result) throw new BadRequestError('Invalid or expired token');
    // После успешного подтверждения перенаправляем на фронтенд
    reply.redirect('http://localhost:5173/login?verified=true');
  };
}