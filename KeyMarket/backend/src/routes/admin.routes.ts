// Маршруты для административной панели
import { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/auth';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';

export default async function adminRoutes(fastify: FastifyInstance) {
  const adminService = new AdminService();
  const controller = new AdminController(adminService);

  // GET /admin/users — список пользователей
  fastify.get('/users', {
    preHandler: [fastify.authenticate, requireRole('admin')],
    schema: {
      tags: ['admin'],
      summary: 'Получить список всех пользователей',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          search: { type: 'string', description: 'Поиск по email' },
          role: { type: 'string', enum: ['buyer', 'seller', 'admin'], description: 'Фильтр по роли' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            users: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  balance: { type: 'string' },
                  is_banned: { type: 'boolean' },
                  created_at: { type: 'string' },
                },
              },
            },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  }, controller.getUsers);

  // PUT /admin/users/:id/ban — бан/разбан
  fastify.put<{ Params: { id: string } }>('/users/:id/ban', {
    preHandler: [fastify.authenticate, requireRole('admin')],
    schema: {
      tags: ['admin'],
      summary: 'Забанить или разбанить пользователя',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID пользователя' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            is_banned: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.toggleBan);

  // PUT /admin/users/:id/role — смена роли
  fastify.put<{ Params: { id: string }; Body: { role: string } }>('/users/:id/role', {
    preHandler: [fastify.authenticate, requireRole('admin')],
    schema: {
      tags: ['admin'],
      summary: 'Изменить роль пользователя',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID пользователя' },
        },
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['buyer', 'seller', 'admin'], description: 'Новая роль' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            role: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.changeRole);

  // GET /admin/products — список товаров
  fastify.get('/products', {
    preHandler: [fastify.authenticate, requireRole('admin')],
    schema: {
      tags: ['admin'],
      summary: 'Получить список всех товаров',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          search: { type: 'string', description: 'Поиск по названию' },
          status: { type: 'string', enum: ['active', 'inactive', 'banned'], description: 'Фильтр по статусу' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            products: { type: 'array', items: {} },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  }, controller.getProducts);

  // GET /admin/orders — список заказов
  fastify.get('/orders', {
    preHandler: [fastify.authenticate, requireRole('admin')],
    schema: {
      tags: ['admin'],
      summary: 'Получить список всех заказов',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 20 },
          search: { type: 'string', description: 'Поиск по email покупателя' },
          status: { type: 'string', enum: ['created', 'delivered', 'cancelled'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            orders: { type: 'array', items: {} },
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
  }, controller.getOrders);
}