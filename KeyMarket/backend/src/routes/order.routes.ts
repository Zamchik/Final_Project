// Маршруты для заказов
import { FastifyInstance } from 'fastify';
import { OrderController } from '../controllers/order.controller';
import { OrderService } from '../services/order.service';
import { NotificationService } from '../services/notification.service';

// Тип тела запроса на создание заказа
interface CreateOrderBody {
  productId: number;
}

// Тип query-параметров для списков заказов
interface OrderListQuery {
  page?: number;
  limit?: number;
  status?: string;
}

export default async function orderRoutes(fastify: FastifyInstance) {
  const notificationService = fastify.notificationService;
  const orderService = new OrderService(notificationService);
  const controller = new OrderController(orderService);

  // Создание заказа (статус 'created')
  fastify.post<{ Body: CreateOrderBody }>(
    '/',
    { preHandler: [fastify.authenticate] },
    controller.create
  );

  // Отмена заказа
  fastify.post<{ Params: { id: string } }>(
    '/:id/cancel',
    { preHandler: [fastify.authenticate] },
    controller.cancel
  );

  // Мои покупки (любой авторизованный)
  fastify.get<{ Querystring: OrderListQuery }>(
    '/my',
    { preHandler: [fastify.authenticate] },
    controller.getMyOrders
  );

  // Мои продажи (доступно всем, но данные вернутся только для seller)
  fastify.get<{ Querystring: OrderListQuery }>(
    '/sales',
    { preHandler: [fastify.authenticate] },
    controller.getMySales
  );

  // Получение одного заказа
  fastify.get<{ Params: { id: string } }>(
    '/:id',
    { preHandler: [fastify.authenticate] },
    controller.getOrder
  );
}