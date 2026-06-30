// Маршруты для заказов

import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';

// Тип тела запроса на создание заказа
interface CreateOrderBody {
  productId: number;
}

// Тип query-параметров для списков заказов
interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export default async function orderRoutes(fastify: FastifyInstance) {
  const notificationService = fastify.notificationService;
  const orderService = new OrderService(notificationService);
  const controller = new OrderController(orderService);

  // POST /orders — создать заказ (статус 'created')
  fastify.post<{ Body: CreateOrderBody }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Создать заказ (статус created) и зарезервировать ключ',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'number', description: 'ID товара для покупки' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            totalPrice: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  price: { type: 'string' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
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
  fastify.post<{ Params: { id: string } }>('/:id/cancel', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Отменить заказ (только если статус created)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID заказа' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
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
  fastify.get<{ Querystring: OrderListQuery }>('/my', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить историю своих покупок',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
          status: { type: 'string', enum: ['created', 'delivered', 'cancelled'], description: 'Фильтр по статусу' },
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
                  id: { type: 'number' },
                  totalPrice: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  items: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number' },
                        price: { type: 'string' },
                        product: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            title: { type: 'string' },
                            price: { type: 'string' },
                          },
                        },
                        productKey: {
                          type: 'object',
                          properties: {
                            id: { type: 'number' },
                            keyValue: { type: 'string' },
                          },
                          description: 'Только для статуса delivered',
                        },
                      },
                    },
                  },
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
  }, controller.getMyOrders);

  // GET /orders/sales — мои продажи
  fastify.get<{ Querystring: OrderListQuery }>('/sales', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить историю своих продаж (для продавца)',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
          status: { type: 'string', enum: ['created', 'delivered', 'cancelled'] },
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
                  id: { type: 'number' },
                  totalPrice: { type: 'string' },
                  status: { type: 'string' },
                  createdAt: { type: 'string' },
                  buyer: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      email: { type: 'string' },
                    },
                  },
                  items: { type: 'array', items: {} },
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
  }, controller.getMySales);

  // GET /orders/:id — получить один заказ
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['orders'],
      summary: 'Получить один заказ (только свой)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID заказа' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            totalPrice: { type: 'string' },
            status: { type: 'string' },
            createdAt: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  price: { type: 'string' },
                  product: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      title: { type: 'string' },
                      price: { type: 'string' },
                    },
                  },
                  productKey: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      keyValue: { type: 'string' },
                    },
                    description: 'Только для статуса delivered',
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