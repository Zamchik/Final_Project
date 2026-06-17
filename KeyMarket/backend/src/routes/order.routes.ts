import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';

// Тип тела запроса на создание заказа
interface CreateOrderBody {
  productId: number;
}

export default async function orderRoutes(fastify: FastifyInstance) {
  const controller = new OrderController(new OrderService());

  fastify.post<{ Body: CreateOrderBody }>(
    '/',
    { preHandler: [fastify.authenticate] },
    controller.create
  );
}