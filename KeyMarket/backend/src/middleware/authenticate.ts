// Middleware аутентификации через сессию

import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Декоратор Fastify, проверяющий наличие данных пользователя в сессии.
 * Если сессии нет или она не содержит 'user', возвращает 401.
 */
export const authenticate = async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.session.get('user')) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
};