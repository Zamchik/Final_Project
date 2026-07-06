// Маршруты административной панели (префикс /admin в app.ts)
import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { prisma } from '../prisma';

export default async function adminRoutes(fastify: FastifyInstance) {
  const adminService = new AdminService(prisma);
  const controller = new AdminController(adminService);

  // GET /admin/users — список пользователей
  fastify.get('/users', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Получить список пользователей (администратор)',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
          search: { type: 'string' },
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
                  id: { type: 'integer' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  bannedAt: { type: 'string', nullable: true },
                  createdAt: { type: 'string' },
                  balance: { type: 'string' }, // Decimal передаётся строкой
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
  }, controller.getUsers);

  // POST /admin/users/:id/ban — забанить пользователя
  fastify.post('/users/:id/ban', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Забанить пользователя',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID пользователя' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            // пустой объект, так как успех определяется статусом 200
          },
        },
      },
    },
  }, controller.banUser);

  // POST /admin/users/:id/unban — разбанить пользователя
  fastify.post('/users/:id/unban', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Разбанить пользователя',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID пользователя' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {},
        },
      },
    },
  }, controller.unbanUser);

  // PUT /admin/users/:id/role — изменить роль
  fastify.put('/users/:id/role', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Изменить роль пользователя',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        properties: {
          id: { type: 'integer', description: 'ID пользователя' },
        },
      },
      body: {
        type: 'object',
        required: ['role'],
        properties: {
          role: { type: 'string', enum: ['BUYER', 'SELLER', 'ADMIN'] },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {},
        },
      },
    },
  }, controller.changeRole);

  // GET /admin/products — список товаров
  fastify.get('/products', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Получить список всех товаров',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  title: { type: 'string' },
                  price: { type: 'string' },
                  status: { type: 'string' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                  createdAt: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
  }, controller.getProducts);

  // GET /admin/orders — список заказов
  fastify.get('/orders', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['admin'],
      summary: 'Получить список всех заказов',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 20 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            orders: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  totalPrice: { type: 'string' },
                  status: { type: 'string' },
                  buyer: {
                    type: 'object',
                    properties: {
                      email: { type: 'string' },
                    },
                  },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        product: {
                          type: 'object',
                          properties: {
                            title: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  createdAt: { type: 'string' },
                },
              },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
        },
      },
    },
  }, controller.getOrders);
}