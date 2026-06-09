import { FastifyInstance } from 'fastify';
import { ProductController } from '../controllers/product.controller';
import { ProductService } from '../services/product.service';
import { requireRole } from '../middleware/auth';

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
}