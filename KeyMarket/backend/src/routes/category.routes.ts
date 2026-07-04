import { FastifyInstance } from 'fastify';
import { CategoryService } from '../services/category.service';
import { prisma } from '../prisma';

export default async function categoryRoutes(fastify: FastifyInstance) {
  const categoryService = new CategoryService(prisma);

  fastify.get('/', {
    schema: {
      tags: ['categories'],
      summary: 'Получить список всех категорий',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              name: { type: 'string' },
              slug: { type: 'string' },
            },
          },
        },
      },
    },
  }, async () => {
    return categoryService.getAll();
  });
}