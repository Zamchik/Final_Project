// Защищённые маршруты для товаров (только для продавцов)
import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product/product.service';
import { requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

export default async function productRoutes(fastify: FastifyInstance) {
  const controller = new ProductController(new ProductService());

  // GET /products/my — список товаров текущего продавца
  fastify.get('/my', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Получить список своих товаров (продавец)',
      security: [{ cookieAuth: [] }],
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
          search: { type: 'string' },
          categoryId: { type: 'integer' },
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
                  stock: { type: 'integer' },
                  status: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                  keys: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        keyValue: { type: 'string' },
                        soldAt: { type: 'string', nullable: true },
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
  }, controller.getMyProducts);

  // POST /products — создать новый товар с ключами
  fastify.post('/', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Создать новый товар с ключами',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['title', 'price', 'categoryId', 'keys'],
        properties: {
          title: { type: 'string', description: 'Название товара' },
          description: { type: 'string', description: 'Описание' },
          price: { type: 'number', description: 'Цена' },
          categoryId: { type: 'integer', description: 'ID категории' },
          imageUrl: { type: 'string', description: 'Ссылка на изображение' },
          keys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Массив ключей (Steam-формат XXXXX-XXXXX-XXXXX)',
          },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            price: { type: 'string' },
            stock: { type: 'integer' },
            status: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            category: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
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
  }, controller.createProduct);

  // PUT /products/:id — обновить товар и/или добавить новые ключи
  fastify.put('/:id', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Обновить товар и/или добавить новые ключи',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID товара' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          categoryId: { type: 'integer' },
          status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          imageUrl: { type: 'string', description: 'Ссылка на изображение' },
          newKeys: {
            type: 'array',
            items: { type: 'string' },
            description: 'Новые ключи для добавления',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            stock: { type: 'integer' },
            status: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
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
  }, controller.updateProduct);

  // DELETE /products/:id — удалить товар и все его ключи
  fastify.delete('/:id', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Удалить товар и все его ключи',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID товара' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {},   // достаточно статуса 200
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.deleteProduct);

  // GET /products/my/:id — получить один товар для редактирования
  fastify.get('/my/:id', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Получить один товар для редактирования (продавец)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer', description: 'ID товара' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'string' },
            stock: { type: 'integer' },
            status: { type: 'string' },
            imageUrl: { type: 'string', nullable: true },
            categoryId: { type: 'integer' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
            keys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  keyValue: { type: 'string' },
                  isSold: { type: 'boolean' },   // пока оставим boolean, т.к. не все мигрировали
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
  }, async (req, reply) => {
    const { id } = req.params as any;
    const sellerId = req.session.get('user')?.id;
    const product = await prisma.product.findFirst({
      where: { id: Number(id), sellerId },
      include: { category: true, keys: true },
    });
    if (!product) {
      reply.status(404).send({ error: 'Товар не найден или нет доступа' });
      return;
    }
    return product;
  });
}