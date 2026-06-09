import { FastifyRequest, FastifyReply } from 'fastify';

export const requireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    // Явно указываем тип, чтобы TypeScript знал, что есть поле role
    const user = request.user as { id: number; email: string; role: string } | undefined;
    if (!user || user.role !== role) {
      reply.status(403).send({ error: 'Forbidden' });
    }
  };
};