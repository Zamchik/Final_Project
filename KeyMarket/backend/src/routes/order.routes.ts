// Маршруты заказов (префикс /orders в app.ts)
import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';
import { prisma } from '../prisma';

export default async function orderRoutes(fastify: FastifyInstance) {
  const orderService = new OrderService(prisma);
  const controller = new OrderController(orderService);

  // POST /orders — создать заказ
  fastify.post('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Создать заказ на покупку товара',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'integer', description: 'ID товара для покупки' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            totalPrice: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  price: { type: 'string' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      title: { type: 'string' },
                      price: { type: 'string' },
                    },
                  },
                },
              },
            },
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
  }, controller.create);

  // POST /orders/:id/cancel — отменить заказ
  fastify.post('/:id/cancel', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Отменить заказ (только статус created)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID заказа' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            // пустой объект – успех
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
  }, controller.cancel);

  // GET /orders/my — мои покупки
  fastify.get('/my', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить список своих покупок',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          status: { type: 'string', enum: ['CREATED', 'PAID', 'CANCELLED', 'DELIVERED'] },
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
                  createdAt: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        price: { type: 'string' },
                        product: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            title: { type: 'string' },
                            price: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
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
  }, controller.getMyOrders);

  // GET /orders/sales — мои продажи (для продавца)
  fastify.get('/sales', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить список своих продаж (продавец)',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          status: { type: 'string', enum: ['CREATED', 'PAID', 'CANCELLED', 'DELIVERED'] },
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
  }, controller.getMySales);

  // GET /orders/:id — получить один заказ
  fastify.get('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить детальную информацию о заказе',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID заказа' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            totalPrice: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  price: { type: 'string' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      title: { type: 'string' },
                      price: { type: 'string' },
                    },
                  },
                  productKey: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      keyValue: { type: 'string' },
                    },
                    nullable: true,
                  },
                },
              },
            },
          },
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.getOrder);
}