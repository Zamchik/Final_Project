import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product/product.service';
import { requireRole } from '../middleware/auth';
import { prisma } from '../prisma';

export default async function productRoutes(fastify: FastifyInstance) {
  // Создаём экземпляр сервиса и контроллера
  const controller = new ProductController(new ProductService());

  // Все маршруты защищены:
  // 1. fastify.authenticate — проверяет сессию и записывает пользователя в request.session
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
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.updateProduct
  );

  fastify.delete(
    '/:id',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.deleteProduct
  );

  // Новый маршрут для получения одного товара (для редактирования продавцом)
  // Используем путь /my/:id, чтобы не конфликтовать с публичным GET /:id
  fastify.get<{ Params: { id: string } }>(
    '/my/:id',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    async (req, reply) => {
      const productId = Number(req.params.id);
      const sellerId = req.session.get('user')?.id; // продавец из сессии

      const product = await prisma.product.findFirst({
        where: { id: productId, sellerId }, // проверяем владельца
        include: { category: true, keys: true },
      });

      if (!product) {
        reply.status(404).send({ error: 'Товар не найден или нет доступа' });
        return;
      }
      return product;
    }
  );
}