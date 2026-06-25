// Контроллер заказов
// Обрабатывает создание, оплату и отмену заказов
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { prisma } from '../prisma';

// Тип для детального ответа о заказе
interface OrderDetails {
  id: number;
  totalPrice: string;
  status: string;
  createdAt: Date;
  items: {
    id: number;
    price: string;
    product: { id: number; title: string; price: string };
    productKey?: { id: number; keyValue: string };
  }[];
}

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

  // GET /orders/:id — получить один заказ (только свой)
  getOrder = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const orderId = Number(req.params.id);
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: { productKey: true, product: true },
        },
      },
    });

    if (!order || order.buyerId !== userId) {
      return reply.status(404).send({ error: 'Заказ не найден' });
    }

    // Явно формируем ответ согласно типу OrderDetails
    const result: OrderDetails = {
      id: order.id,
      totalPrice: order.totalPrice.toString(),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item) => ({
        id: item.id,
        price: item.price.toString(),
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price.toString(),
        },
        // Ключ только для delivered
        ...(order.status === 'delivered' && item.productKey
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