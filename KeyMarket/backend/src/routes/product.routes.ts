import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';
import { requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

export default async function productRoutes(fastify: FastifyInstance) {
  // Создаём экземпляр сервиса и контроллера
  const controller = new ProductController(new ProductService());

  // Все маршруты защищены:
  // 1. fastify.authenticate — проверяет JWT токен и записывает payload в request.user
  // 2. requireRole('seller') — пускает только пользователей с ролью 'seller'
  fastify.get(
    '/my',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.getMyProducts
  );

  fastify.post(
    '/',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.createProduct
  );

  fastify.put(
    '/:id', // :id — динамический параметр, например, /products/5
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.updateProduct
  );

  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.deleteProduct
  );

  // Новый маршрут для получения одного товара (для редактирования)
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    async (req, reply) => {
      const id = Number(req.params.id);
      const product = await prisma.product.findUnique({
        where: { id },
        include: { category: true, keys: true },
      });
      if (!product) {
        reply.status(404).send({ error: 'Товар не найден' });
        return;
      }
      return product;
    }
  );
}