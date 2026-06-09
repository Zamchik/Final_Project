import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export default async function categoryRoutes(fastify: FastifyInstance) {
  fastify.get('/', async () => {
    const categories = await prisma.category.findMany();
    return categories;
  });
}