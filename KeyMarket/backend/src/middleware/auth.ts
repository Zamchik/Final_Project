import { FastifyRequest, FastifyReply } from 'fastify';

export const requireRole = (role: string) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.session.get('user');
    if (!user || user.role !== role) {
      reply.status(403).send({ error: 'Forbidden' });
    }
  };
};