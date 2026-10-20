// Контроллер заказов
import { FastifyRequest, FastifyReply } from 'fastify';
import { OrderService } from '../services/order.service';
import { NotFoundError, UnauthorizedError } from '../common/errors';

export class OrderController {
  constructor(private orderService: OrderService) { }

  // POST /orders — создать заказ
  create = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { productId } = req.body as any;
    const order = await this.orderService.createOrder(userId, productId);
    reply.status(201).send(order);
  };

  // POST /orders/:id/cancel — отменить заказ
  cancel = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { id } = req.params as any;
    return this.orderService.cancelOrder(Number(id), userId);
  };

  // GET /orders/my — мои покупки
  getMyOrders = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, status } = req.query as any;
    return this.orderService.getMyOrders(userId, Number(page), Number(limit), status);
  };

  // GET /orders/sales — мои продажи (продавец)
  getMySales = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, status } = req.query as any;
    return this.orderService.getSales(userId, Number(page), Number(limit), status);
  };

  // GET /orders/:id — получить один заказ
  getOrder = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { id } = req.params as any;
    const order = await this.orderService.getOrderById(Number(id), userId);
    if (!order) throw new NotFoundError('Заказ не найден')

    // ответ с ключами только для оплаченных/доставленных
    const result = {
      id: order.id,
      totalPrice: order.totalPrice.toString(),
      status: order.status,
      createdAt: order.createdAt,
      buyerId: order.buyerId,
      sellerId: order.items[0]?.product.sellerId,
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