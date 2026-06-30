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
      security: [{ cookieAuth: [] }],                    // требует авторизации
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
          search: { type: 'string' },
          categoryId: { type: 'number' },
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
          categoryId: { type: 'number', description: 'ID категории' },
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
            id: { type: 'number' },
            title: { type: 'string' },
            price: { type: 'string' },
            stock: { type: 'number' },
            status: { type: 'string' },
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
          id: { type: 'string', description: 'ID товара' },
        },
      },
      body: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          categoryId: { type: 'number' },
          status: { type: 'string', enum: ['active', 'inactive'] },
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
            id: { type: 'number' },
            title: { type: 'string' },
            stock: { type: 'number' },
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
          id: { type: 'string', description: 'ID товара' },
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
  }, controller.deleteProduct);

  // GET /products/my/:id — получить один товар для редактирования
  fastify.get<{ Params: { id: string } }>('/my/:id', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['products'],
      summary: 'Получить один товар для редактирования (продавец)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID товара' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'string' },
            stock: { type: 'number' },
            status: { type: 'string' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
            keys: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  keyValue: { type: 'string' },
                  isSold: { type: 'boolean' },
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
    const productId = Number(req.params.id);
    const sellerId = req.session.get('user')?.id;
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
      include: { category: true, keys: true },
    });
    if (!product) {
      reply.status(404).send({ error: 'Товар не найден или нет доступа' });
      return;
    }
    return product;
  });
}