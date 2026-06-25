// Контроллер заказов
// Обрабатывает создание, оплату и отмену заказов
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private orderService: OrderService) { }

  // POST /orders — создать заказ (статус 'created')
  create = async (req: FastifyRequest<{ Body: { productId: number } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const order = await this.orderService.createOrder(userId, req.body.productId);
      reply.status(201).send(order);
    } catch (err) {
      const message = (err as Error).message;
      console.error('Ошибка создания заказа:', message);
      reply.status(400).send({ error: message });
    }
  };

  // POST /orders/:id/pay — оплатить заказ
  pay = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const order = await this.orderService.payOrder(Number(req.params.id), userId);
      return order;
    } catch (err) {
      const message = (err as Error).message;
      console.error('Ошибка оплаты заказа:', message);
      reply.status(400).send({ error: message });
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
      const message = (err as Error).message;
      console.error('Ошибка отмены заказа:', message);
      reply.status(400).send({ error: message });
    }
  };

  // GET /orders/my — мои покупки
  getMyOrders = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { page = 1, limit = 10, status } = req.query;
    return this.orderService.getMyOrders(userId, Number(page), Number(limit), status);
  };

   // GET /orders/sales — мои продажи (для продавца)
  getMySales = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { page = 1, limit = 10, status } = req.query;
    return this.orderService.getMySales(userId, Number(page), Number(limit), status);
  };
}