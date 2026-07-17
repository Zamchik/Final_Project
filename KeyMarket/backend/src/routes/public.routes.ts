// Публичные маршруты для товаров (каталог, карточка, отзывы, рейтинг)
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { ReviewService } from '../services/review.service';
import { prisma } from '../prisma';

export default async function publicRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();
  const reviewService = new ReviewService(prisma);

  // GET /products (публичный каталог)
  fastify.get('/', {
    schema: {
      tags: ['products'],
      summary: 'Публичный каталог товаров',
      description:
        'Возвращает список активных товаров с пагинацией, фильтрацией и сортировкой. ' +
        'Можно фильтровать по категории, диапазону цен, типу товара (GAME/DLC) и искать по названию.',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1, description: 'Номер страницы' },
          limit: { type: 'integer', default: 12, description: 'Товаров на странице' },
          search: { type: 'string', description: 'Поиск по названию (регистронезависимый)' },
          categoryId: { type: 'integer', description: 'Фильтр по ID категории' },
          minPrice: { type: 'number', description: 'Минимальная цена' },
          maxPrice: { type: 'number', description: 'Максимальная цена' },
          sort: {
            type: 'string',
            enum: ['price_asc', 'price_desc', 'newest'],
            description: 'Сортировка: по возрастанию/убыванию цены или новизне',
          },
          productType: {
            type: 'string',
            enum: ['GAME', 'DLC'],
            description: 'Тип товара: игра или дополнение',
          },
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
                  rating: { type: 'string' },
                  imageUrl: { type: 'string', nullable: true },
                  productType: { type: 'string', description: 'GAME или DLC' },
                  sales: { type: 'integer', description: 'Количество продаж' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'integer' },
                      name: { type: 'string' },
                    },
                  },
                  createdAt: { type: 'string' },
                },
              },
            },
            total: { type: 'integer', description: 'Общее количество товаров' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
          examples: [
            {
              products: [
                {
                  id: 1,
                  title: 'Cyberpunk 2077',
                  price: '1999',
                  rating: '4.5',
                  imageUrl: '/uploads/abc.jpg',
                  productType: 'GAME',
                  sales: 150,
                  category: { id: 1, name: 'Экшен' },
                  createdAt: '2026-07-16T12:00:00.000Z',
                },
              ],
              total: 1,
              page: 1,
              limit: 12,
            },
          ],
        },
      },
    },
  }, async (req: FastifyRequest) => {
    const { page = 1, limit = 12, search, categoryId, minPrice, maxPrice, sort, productType } = req.query as any;
    return productService.getPublicList({
      page: Number(page),
      limit: Number(limit),
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
      productType,
    });
  });

  // GET /products/:id (детальная карточка)
  fastify.get('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Детальная информация о товаре',
      description:
        'Возвращает все данные товара, кроме проданных ключей. Включает категорию, количество доступных ключей и общее количество продаж.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer', description: 'ID товара' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'string' },
            rating: { type: 'string' },
            stock: { type: 'integer', description: 'Количество доступных ключей' },
            imageUrl: { type: 'string', nullable: true },
            productType: { type: 'string' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
            status: { type: 'string' },
            salesCount: { type: 'integer', description: 'Общее число продаж' },
          },
          examples: [
            {
              id: 1,
              title: 'Cyberpunk 2077',
              description: 'Ролевая игра в открытом мире.',
              price: '1999',
              rating: '4.5',
              stock: 2,
              imageUrl: '/uploads/abc.jpg',
              productType: 'GAME',
              category: { id: 1, name: 'Экшен' },
              status: 'ACTIVE',
              salesCount: 150,
            },
          ],
        },
        404: {
          type: 'object',
          properties: { error: { type: 'string' } },
          description: 'Товар не найден или неактивен',
        },
      },
    },
  }, async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as any;
    const product = await productService.getProductById(Number(id));
    if (!product) {
      return reply.status(404).send({ error: 'Товар не найден' });
    }
    return product;
  });

  // GET /products/:id/reviews
  fastify.get('/:id/reviews', {
    schema: {
      tags: ['products'],
      summary: 'Получить отзывы о товаре',
      description: 'Возвращает список отзывов с пагинацией.',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 10 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            reviews: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer' },
                  rating: { type: 'integer' },
                  comment: { type: 'string' },
                  createdAt: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: { email: { type: 'string' } },
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
  }, async (req: FastifyRequest) => {
    const { id } = req.params as any;
    const { page = 1, limit = 10 } = req.query as any;
    return reviewService.getByProduct(Number(id), Number(page), Number(limit));
  });

  // GET /products/:id/rating
  fastify.get('/:id/rating', {
    schema: {
      tags: ['products'],
      summary: 'Получить средний рейтинг товара',
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'integer' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            average: { type: 'number', description: 'Средняя оценка (0-5)' },
            count: { type: 'integer', description: 'Количество отзывов' },
          },
        },
      },
    },
  }, async (req: FastifyRequest) => {
    const { id } = req.params as any;
    return reviewService.getAverageRating(Number(id));
  });
}