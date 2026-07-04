// Маршруты для отзывов
import { FastifyInstance } from 'fastify';
import { ReviewController } from '../controllers/review.controller';
import { ReviewService } from '../services/review.service';
import { prisma } from '../prisma';

interface CreateReviewBody {
  productId: number;
  orderId: number;
  rating: number;
  comment?: string;
}

export default async function reviewRoutes(fastify: FastifyInstance) {
  const reviewService = new ReviewService(prisma);
  const controller = new ReviewController(reviewService);

  // POST /reviews — создать отзыв
  fastify.post<{ Body: CreateReviewBody }>('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['reviews'],
      summary: 'Оставить отзыв о товаре (только после успешной покупки)',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['productId', 'orderId', 'rating'],
        properties: {
          productId: { type: 'number', description: 'ID товара' },
          orderId: { type: 'number', description: 'ID завершённого заказа' },
          rating: { type: 'number', minimum: 1, maximum: 5, description: 'Оценка от 1 до 5' },
          comment: { type: 'string', description: 'Текст отзыва (опционально)' },
        },
      },
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            rating: { type: 'number' },
            comment: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.create);

  // GET /reviews — получить отзывы (с фильтром по productId и пагинацией)
  fastify.get('/', {
    schema: {
      tags: ['reviews'],
      summary: 'Получить список отзывов',
      querystring: {
        type: 'object',
        properties: {
          productId: { type: 'number', description: 'ID товара для фильтрации' },
          page: { type: 'number', default: 1 },
          limit: { type: 'number', default: 100 },
        },
      },
      response: {
        200: {
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
                  email: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
  }, async (request) => {
    const { productId, page = 1, limit = 100 } = request.query as any;

    const result = productId
      ? await reviewService.getByProduct(Number(productId), Number(page), Number(limit))
      : await reviewService.getAll(Number(page), Number(limit));

    // Для обратной совместимости с текущим фронтендом возвращаем только массив отзывов
    return result.reviews;
  });
}