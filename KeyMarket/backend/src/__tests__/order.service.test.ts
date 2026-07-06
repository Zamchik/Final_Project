import { OrderService } from '../services/order.service';
import { prisma } from '../prisma';

describe('OrderService', () => {
  let orderService: OrderService;

  beforeAll(() => {
    orderService = new OrderService(prisma);
  });

  it('должен выбросить ошибку при создании заказа для несуществующего товара', async () => {
    await expect(orderService.createOrder(1, 99999))
      .rejects.toThrow('Товар недоступен');
  });

  it('должен выбросить ошибку при отмене несуществующего заказа', async () => {
    await expect(orderService.cancelOrder(99999, 1))
      .rejects.toThrow('Заказ не найден или не принадлежит вам');
  });
});