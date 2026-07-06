// Middleware аутентификации через сессию с проверкой бана
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../prisma';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

/**
 * Декоратор Fastify, проверяющий наличие и актуальность сессии.
 * Если пользователь забанен – выбрасывает ForbiddenError.
 * При успехе обновляет данные пользователя в сессии из базы.
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  // 1. Получаем данные пользователя из сессии (положены при входе)
  const sessionUser = request.session.get('user');
  if (!sessionUser || !sessionUser.id) {
    throw new UnauthorizedError('Unauthorized');
  }

  // 2. Загружаем свежие данные из базы (роль, бан)
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, email: true, role: true, bannedAt: true },
  });

  if (!user) {
    // Пользователь удалён из базы – сессия невалидна
    throw new UnauthorizedError('Unauthorized');
  }

  // 3. Проверяем бан – если bannedAt не null, доступ запрещён
  if (user.bannedAt) {
    throw new ForbiddenError('Ваш аккаунт заблокирован');
  }

  // 4. Обновляем сессию актуальными данными (роль могла измениться)
  request.session.set('user', {
    id: user.id,
    email: user.email,
    role: user.role,
  });
};