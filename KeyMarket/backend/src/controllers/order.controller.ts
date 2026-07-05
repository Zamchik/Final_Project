// Контроллер заказов
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { NotFoundError, UnauthorizedError } from '../common/errors';

export class OrderController {
  constructor(private orderService: OrderService) { }

  // POST /orders — создать заказ
  create = async (req: FastifyRequest<{ Body: { productId: number } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const order = await this.orderService.createOrder(userId, req.body.productId);
    reply.status(201).send(order);
  };

  // POST /orders/:id/cancel — отменить заказ
  cancel = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const result = await this.orderService.cancelOrder(Number(req.params.id), userId);
    return result;
  };

  // GET /orders/my — мои покупки
  getMyOrders = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, status } = req.query;
    return this.orderService.getMyOrders(userId, Number(page), Number(limit), status);
  };

  // GET /orders/sales — мои продажи (продавец)
  getMySales = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; status?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, status } = req.query;
    return this.orderService.getSales(userId, Number(page), Number(limit), status);
  };

  // GET /orders/:id — получить один заказ
  getOrder = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const orderId = Number(req.params.id);
    const order = await this.orderService.getOrderById(orderId, userId);
    if (!order) {
      throw new NotFoundError('Заказ не найден');
    }

    // ответ с ключами только для оплаченных/доставленных
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
        ...((order.status === 'PAID' || order.status === 'DELIVERED') && item.productKey
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