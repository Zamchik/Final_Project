// Контроллер заказов
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { OrderStatus } from '@prisma/client';

export class OrderController {
  constructor(private orderService: OrderService) {}

  // POST /orders — создать заказ
  create = async (req: FastifyRequest<{ Body: { productId: number } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const order = await this.orderService.createOrder(userId, req.body.productId);
      reply.status(201).send(order);
    } catch (err) {
      // временно оставим сообщение, позже заменим на кастомные ошибки
      reply.status(400).send({ error: (err as Error).message });
    }
  };

  // POST /orders/:id/cancel — отменить заказ
  cancel = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const result = await this.orderService.cancelOrder(Number(req.params.id), userId);
      return result;
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

  // GET /orders/my — мои покупки (используем метод сервиса getMyOrders)
  getMyOrders = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { page = 1, limit = 10, status } = req.query;
    // сервис ожидает OrderStatus? Но здесь пока строку, преобразуем при необходимости
    return this.orderService.getMyOrders(userId, Number(page), Number(limit), status as OrderStatus);
  };

  // GET /orders/sales — мои продажи (продавец)
  getMySales = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { page = 1, limit = 10, status } = req.query;
    return this.orderService.getSales(userId, Number(page), Number(limit), status as OrderStatus);
  };

  // GET /orders/:id — получить один заказ (используем сервис вместо прямого Prisma)
  getOrder = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const orderId = Number(req.params.id);

    // используем метод сервиса getOrderById (должен быть в OrderService)
    const order = await this.orderService.getOrderById(orderId, userId);
    if (!order) {
      return reply.status(404).send({ error: 'Заказ не найден' });
    }

    // Формируем детальный ответ с ключами только для оплаченных/доставленных
    const result = {
      id: order.id,
      totalPrice: order.totalPrice.toString(),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item: any) => ({
        id: item.id,
        price: item.price.toString(),
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price.toString(),
        },
        // Ключ показываем только если заказ в статусе PAID или DELIVERED
        ...( (order.status === OrderStatus.PAID || order.status === OrderStatus.DELIVERED) && item.productKey
          ? {
              productKey: {
                id: item.productKey.id,
                keyValue: item.productKey.keyValue,
              },
            }
          : {}),
      })),
    };

    return result;
  };
}