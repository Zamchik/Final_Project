// Публичные маршруты для товаров (каталог, карточка, отзывы, рейтинг)
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { ReviewService } from '../services/review.service';
import { prisma } from '../prisma';

// Типы для query-параметров и параметров URL
interface PublicQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

interface ProductParams {
  id: string;
}

export default async function publicRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();
  const reviewService = new ReviewService();            // для отзывов и рейтинга

  // GET /products — публичный каталог с фильтрами и пагинацией
  fastify.get('/', {
    schema: {
      tags: ['products'],
      summary: 'Публичный каталог товаров с фильтрами и пагинацией',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1, description: 'Номер страницы' },
          limit: { type: 'number', default: 12, description: 'Товаров на странице' },
          search: { type: 'string', description: 'Поиск по названию' },
          categoryId: { type: 'number', description: 'Фильтр по категории' },
          minPrice: { type: 'number', description: 'Минимальная цена' },
          maxPrice: { type: 'number', description: 'Максимальная цена' },
          sort: { type: 'string', enum: ['price_asc', 'price_desc', 'newest'], description: 'Сортировка' },
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
                  id: { type: 'number' },
                  title: { type: 'string' },
                  price: { type: 'string' },
                  rating: { type: 'string' },
                  category: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      name: { type: 'string' },
                    },
                  },
                  createdAt: { type: 'string' },
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
  }, async (request: FastifyRequest<{ Querystring: PublicQuery }>) => {
    const { page = 1, limit = 12, search, categoryId, minPrice, maxPrice, sort } = request.query;
    return productService.getPublicList({
      page: Number(page),
      limit: Number(limit),
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    });
  });

  // GET /products/:id — детальная информация о товаре (карточка)
  fastify.get('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Детальная информация о товаре',
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
            rating: { type: 'string' },
            stock: { type: 'number' },
            category: {
              type: 'object',
              properties: {
                id: { type: 'number' },
                name: { type: 'string' },
              },
            },
            status: { type: 'string' },
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
  }, async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ) => {
    const productId = Number(request.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, keys: true },
    });

    if (!product || product.status !== 'active') {
      return reply.status(404).send({ error: 'Товар не найден' });
    }

    const { keys, ...rest } = product;
    return {
      ...rest,
      stock: keys.filter((k) => !k.isSold).length,
    };
  });

  // GET /products/:id/reviews — отзывы о товаре
  fastify.get('/:id/reviews', {
    schema: {
      tags: ['products'],
      summary: 'Получить отзывы о товаре',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID товара' },
        },
      },
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 10 },
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
                  id: { type: 'number' },
                  rating: { type: 'number' },
                  comment: { type: 'string' },
                  createdAt: { type: 'string' },
                  user: {
                    type: 'object',
                    properties: {
                      id: { type: 'number' },
                      email: { type: 'string' },
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
  }, async (
    request: FastifyRequest<{ Params: { id: string }; Querystring: { page?: number; limit?: number } }>,
    reply: FastifyReply
  ) => {
    const productId = Number(request.params.id);
    const { page = 1, limit = 10 } = request.query;
    return reviewService.getByProduct(productId, Number(page), Number(limit));
  });

  // GET /products/:id/rating — средний рейтинг товара
  fastify.get('/:id/rating', {
    schema: {
      tags: ['products'],
      summary: 'Получить средний рейтинг товара',
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
            average: { type: 'number' },
            count: { type: 'number' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) => {
    const productId = Number(request.params.id);
    return reviewService.getAverageRating(productId);
  });
}