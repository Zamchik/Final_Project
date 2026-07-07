// Сервис управления заказами
import { PrismaClient, OrderStatus, TransactionType } from '@prisma/client';
import { NotFoundError, ConflictError } from '../common/errors';

const COMMISSION_RATE = 0.05; // 5%

export class OrderService {
  constructor(private prisma: PrismaClient) { }

  // Создание заказа (покупатель)
  async createOrder(buyerId: number, productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { keys: true },
    });

    if (!product || product.status !== 'ACTIVE') {
      throw new ConflictError('Товар недоступен')
    }

    const availableKey = product.keys.find(k => !k.soldAt);
    if (!availableKey) {
      throw new ConflictError('Нет доступных ключей');
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
      throw new NotFoundError('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== OrderStatus.CREATED) {
      throw new ConflictError('Заказ уже оплачен или отменён');
    }

    // Обновляем статус заказа на DELIVERED
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.DELIVERED },
      include: { items: { include: { productKey: true, product: true } } },
    });

    // Получаем информацию о товаре и продавце
    const product = updatedOrder.items[0].product;
    const sellerId = product.sellerId;
    const amount = order.totalPrice;

    // Рассчитываем комиссию
    const commission = amount.mul(COMMISSION_RATE);   // amount * 0.05
    const sellerAmount = amount.minus(commission);    // сумма, которую получит продавец

    // Начисляем деньги продавцу (за вычетом комиссии)
    await this.prisma.user.update({
      where: { id: sellerId },
      data: { balance: { increment: sellerAmount } },
    });

    // Создаём транзакцию для продавца (продажа)
    await this.prisma.transaction.create({
      data: {
        userId: sellerId,
        type: TransactionType.SALE,
        amount: sellerAmount,
        orderId,
      },
    });

    // Создаём транзакцию для покупателя (покупка)
    await this.prisma.transaction.create({
      data: {
        userId: buyerId,
        type: TransactionType.PURCHASE,
        amount,
        orderId,
      },
    });

    // Создаём транзакцию комиссии платформы
    await this.prisma.transaction.create({
      data: {
        userId: sellerId,       // можно также записать на системный аккаунт, если будет
        type: TransactionType.COMMISSION,
        amount: commission,
        orderId,
      },
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
        include: { items: { include: { productKey: true, product: true, } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    console.log('getMyOrders — first order items:', orders[0]?.items);
    return { orders, total, page, limit };
  }

  // Получить продажи (для продавца)
  async getSales(sellerId: number, page: number, limit: number, status?: OrderStatus) {
    const where: any = {
      items: { some: { product: { sellerId } } },
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: { select: { email: true } },
          items: {
            include: {
              productKey: true,
              product: true,
            },
          },
        },
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
      throw new NotFoundError('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== OrderStatus.CREATED) {
      throw new NotFoundError('Нельзя отменить оплаченный или уже отменённый заказ');
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