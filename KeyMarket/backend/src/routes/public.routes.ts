// Публичные маршруты для товаров (каталог, карточка, отзывы, рейтинг)
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { ReviewService } from '../services/review.service';
import { prisma } from '../prisma';

export default async function publicRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();
  const reviewService = new ReviewService(prisma);

  // GET /products — публичный каталог
  fastify.get('/', {
    schema: {
      tags: ['products'],
      summary: 'Публичный каталог товаров с фильтрами и пагинацией',
      querystring: {
        type: 'object',
        properties: {
          page: { type: 'integer', default: 1 },
          limit: { type: 'integer', default: 12 },
          search: { type: 'string' },
          categoryId: { type: 'integer' },
          minPrice: { type: 'number' },
          maxPrice: { type: 'number' },
          sort: { type: 'string', enum: ['price_asc', 'price_desc', 'newest'] },
          productType: { type: 'string', enum: ['GAME', 'DLC'] },
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
                  productType: { type: 'string' },
                  sales: { type: 'integer' },
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
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
          },
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

  // GET /products/:id — детальная карточка товара
  fastify.get('/:id', {
    schema: {
      tags: ['products'],
      summary: 'Детальная информация о товаре',
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
            stock: { type: 'integer' },
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
            salesCount: { type: 'integer' },
          },
        },
        404: { type: 'object', properties: { error: { type: 'string' } } },
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

  // GET /products/:id/reviews — отзывы
  fastify.get('/:id/reviews', {
    schema: {
      tags: ['products'],
      summary: 'Получить отзывы о товаре',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
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
                    properties: {
                      email: { type: 'string' },
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
  }, async (req: FastifyRequest) => {
    const { id } = req.params as any;
    const { page = 1, limit = 10 } = req.query as any;
    return reviewService.getByProduct(Number(id), Number(page), Number(limit));
  });

  // GET /products/:id/rating — средний рейтинг
  fastify.get('/:id/rating', {
    schema: {
      tags: ['products'],
      summary: 'Получить средний рейтинг товара',
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            average: { type: 'number' },
            count: { type: 'integer' },
          },
        },
      },
    },
  }, async (req: FastifyRequest) => {
    const { id } = req.params as any;
    return reviewService.getAverageRating(Number(id));
  });
}