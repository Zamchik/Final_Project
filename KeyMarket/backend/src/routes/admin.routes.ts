// Временный тестовый маршрут для проверки доступа к admin
import { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/auth';

export default async function adminRoutes(fastify: FastifyInstance) {
  // GET /admin/check – доступен только админам
  fastify.get(
    '/check',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    async () => {
      return { ok: true, message: 'Доступ разрешён' };
    }
  );
}