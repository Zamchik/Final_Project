import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';

export class OrderController {
  constructor(private orderService: OrderService) { }

  create = async (req: FastifyRequest<{ Body: { productId: number } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    try {
      const order = await this.orderService.createOrder(userId, req.body.productId);
      reply.status(201).send(order);
    } catch (err) {
      const message = (err as Error).message;
      console.error('Ошибка создания заказа:', message);  // <-- вот эта строка
      reply.status(400).send({ error: message });
    }
  };
}