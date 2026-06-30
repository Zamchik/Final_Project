// Маршруты аутентификации
import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

// Тип тела запроса для смены пароля
interface ChangePasswordBody {
  oldPassword: string;
  newPassword: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(prisma);
  const controller = new AuthController(authService);

  // POST /auth/register — регистрация нового пользователя
  fastify.post('/register', controller.register);

  // GET /auth/verify-email — подтверждение email по токену (без аутентификации)
  fastify.get('/verify-email', controller.verifyEmail);

  // POST /auth/login — вход в систему
  fastify.post('/login', controller.login);

  // GET /auth/me — получить данные текущего пользователя (требует авторизации)
  fastify.get('/me', { preHandler: [fastify.authenticate] }, controller.me);

  // POST /auth/logout — выход из системы
  fastify.post('/logout', controller.logout);

  // POST /auth/change-password — смена пароля (требует авторизации)
  fastify.post<{ Body: ChangePasswordBody }>(
    '/change-password',
    { preHandler: [fastify.authenticate] },
    controller.changePassword
  );
}