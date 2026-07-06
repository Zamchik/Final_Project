// Middleware для проверки роли пользователя
import { FastifyRequest, FastifyReply } from 'fastify';
import { ForbiddenError } from '../common/errors';

// Проверяет, что у текущего пользователя есть указанная роль.
// Если роль не совпадает – выбрасывает ForbiddenError.
export const requireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.session.get('user');
    if (!user || user.role !== role) {
      throw new ForbiddenError('Forbidden');
    }
  };
};