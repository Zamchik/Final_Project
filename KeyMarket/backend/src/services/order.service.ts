// Сервис управления заказами
import { PrismaClient, OrderStatus } from '@prisma/client';

export class OrderService {
  constructor(private prisma: PrismaClient) { }

  // Создание заказа (покупатель)
  async createOrder(buyerId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { keys: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new Error('Товар недоступен');
    }

    const availableKey = product.keys.find(k => !k.soldAt);
    if (!availableKey) {
      throw new Error('Нет доступных ключей');
    }

    const order = await this.prisma.order.create({
      data: {
        buyerId,
        totalPrice: product.price,
        status: OrderStatus.CREATED,
        items: {
          create: {
            productId,
            productKeyId: availableKey.id,
            price: product.price,
          },
        },
      },
      include: { items: true },
    });

    // Помечаем ключ как проданный (устанавливаем дату продажи)
    await this.prisma.productKey.update({
      where: { id: availableKey.id },
      data: { soldAt: new Date() },
    });

    return order;
  }

  // Оплата заказа (подтверждение)
  async payOrder(orderId: number, buyerId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { productKey: true, product: true } } },
    });

    if (!order || order.buyerId !== buyerId) {
      throw new Error('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== OrderStatus.CREATED) {
      throw new Error('Заказ уже оплачен или отменён');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.PAID },
      include: { items: { include: { productKey: true, product: true } } },
    });

    return updatedOrder;
  }

  // Получить заказы покупателя
  async getMyOrders(userId: number, page: number, limit: number, status?: OrderStatus) {
    const where: any = { buyerId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }

  // Получить продажи (для продавца)
  async getSales(userId: number, page: number, limit: number, status?: OrderStatus) {
    const where: any = { buyerId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }

  // Отмена заказа
  async cancelOrder(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.buyerId !== userId) {
      throw new Error('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== OrderStatus.CREATED) {
      throw new Error('Нельзя отменить оплаченный или уже отменённый заказ');
    }

    // Возвращаем ключ в доступные
    const item = order.items[0];
    if (item) {
      await this.prisma.productKey.update({
        where: { id: item.productKeyId },
        data: { soldAt: null },
      });
    }

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
    });

    return { success: true };
  }

  // Получить заказ по ID
  async getOrderById(orderId: number, userId: number) {
    return this.prisma.order.findFirst({
      where: { id: orderId, buyerId: userId },
      include: {
        items: {
          include: { productKey: true, product: true },
        },
      },
    });
  }
}