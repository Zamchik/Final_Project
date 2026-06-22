// Маршруты для административной панели
import { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/auth';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';

export default async function adminRoutes(fastify: FastifyInstance) {
  const adminService = new AdminService();
  const controller = new AdminController(adminService);

  // GET /admin/users — список пользователей
  fastify.get(
    '/users',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    controller.getUsers
  );

  // PUT /admin/users/:id/ban — бан / разбан
  fastify.put<{ Params: { id: string } }>(
    '/users/:id/ban',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    controller.toggleBan
  );

  // PUT /admin/users/:id/role — смена роли
  fastify.put<{ Params: { id: string }; Body: { role: string } }>(
    '/users/:id/role',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    controller.changeRole
  );

  // GET /admin/products — список всех товаров
  fastify.get(
    '/products',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    controller.getProducts
  );

  // GET /admin/orders — список всех заказов
  fastify.get(
    '/orders',
    { preHandler: [fastify.authenticate, requireRole('admin')] },
    controller.getOrders
  );
}