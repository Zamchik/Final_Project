// Маршруты для категорий
import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export default async function categoryRoutes(fastify: FastifyInstance) {
   // GET /categories — публичный список категорий.
   // Используется для выпадающих списков при создании/фильтрации товаров.
  fastify.get('/', {
    schema: {
      tags: ['products'],                              // группировка в Swagger UI
      summary: 'Получить список всех категорий',       // краткое описание маршрута
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              name: { type: 'string' },
              slug: { type: 'string' },
            },
          },
        },
      },
    },
  }, async () => {
    const categories = await prisma.category.findMany();
    return categories;
  });
}