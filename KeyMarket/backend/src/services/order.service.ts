// Сервис заказов — основной процесс покупки
import { prisma } from '../prisma';
import { NotificationService } from '../services/notification.service'; // правильный импорт

const PLATFORM_FEE = 0.05; // комиссия площадки 5%

// Вспомогательный тип для элемента заказа с ключом и товаром
interface OrderItemWithDetails {
  id: number;
  price: { toString: () => string };
  productKey: { id: number; keyValue: string };
  product: { id: number; title: string; price: { toString: () => string } };
}

export class OrderService {
  constructor(
    private notificationService?: NotificationService // опционально, чтобы не ломать старые вызовы
  ) { }

   // Создать заказ (статус 'created') и зарезервировать ключ.
   // Баланс НЕ списывается.
    async createOrder(buyerId: number, productId: number) {
    // Проверяем товар и наличие свободных ключей
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { keys: true },
    });
    if (!product || product.status !== 'active') {
      throw new Error('Товар недоступен');
    }
    const availableKey = product.keys.find((k) => !k.isSold);
    if (!availableKey) {
      throw new Error('Нет доступных ключей');
    }

    // Создаём заказ и резервируем ключ в одной транзакции
    let order;
    try {
      order = await prisma.$transaction(async (tx) => {
        // Помечаем ключ как проданный (резервируем)
        await tx.productKey.update({
          where: { id: availableKey.id },
          data: { isSold: true },
        });

        // Создаём заказ со статусом 'created'
        const newOrder = await tx.order.create({
          data: {
            buyerId,
            totalPrice: product.price,
            status: 'created',
            items: {
              create: {
                productId,
                productKeyId: availableKey.id,
                price: product.price,
              },
            },
          },
          include: {
            items: {
              include: { productKey: true, product: true },
            },
          },
        });

        return newOrder;
      });
    } catch (err) {
      // Выводим полную ошибку Prisma, чтобы увидеть, какое поле нарушено
      console.error('Полная ошибка создания заказа:', JSON.stringify(err, null, 2));
      throw err;
    }

    // Возвращаем информацию о заказе (без ключа, т.к. ещё не оплачен)
    return {
      id: order.id,
      totalPrice: order.totalPrice.toString(),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item: OrderItemWithDetails) => ({
        id: item.id,
        price: item.price.toString(),
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price.toString(),
        },
      })),
    };
  }

   // Закрыть заказ после успешной оплаты (вызывается из PaymentService).
   // Начисляет деньги продавцу, комиссию платформе, меняет статус на 'delivered'.
   // БАЛАНС ПОКУПАТЕЛЯ НЕ ТРОГАЕТ (оплата прошла через шлюз).
  async payOrder(orderId: number, buyerId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { productKey: true, product: true } } },
    });

    if (!order || order.buyerId !== buyerId) {
      throw new Error('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== 'created') {
      throw new Error('Заказ уже оплачен или отменён');
    }

    const totalPrice = order.totalPrice;
    const sellerId = order.items[0].product.sellerId;
    const sellerAmount = totalPrice.mul(1 - PLATFORM_FEE);

    // Финансовые операции и смена статуса (без списания с покупателя)
    await prisma.$transaction(async (tx) => {
      // Начисляем продавцу
      await tx.user.update({
        where: { id: sellerId },
        data: { balance: { increment: sellerAmount } },
      });

      // Получаем или создаём системного пользователя для комиссии
      let systemUser = await tx.user.findUnique({
        where: { email: 'system@keymarket.local' },
      });
      if (!systemUser) {
        systemUser = await tx.user.create({
          data: {
            email: 'system@keymarket.local',
            password_hash: 'not_a_real_hash',
            role: 'admin',
            balance: 0,
          },
        });
      }

      // Записываем транзакции
      await tx.transaction.createMany({
        data: [
          {
            userId: sellerId,
            type: 'sale',
            amount: sellerAmount,
            orderId: order.id,
          },
          {
            userId: systemUser.id,
            type: 'commission',
            amount: totalPrice.minus(sellerAmount),
            orderId: order.id,
          },
        ],
      });

      // Меняем статус заказа и уменьшаем сток товара
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'delivered' },
      });

      const productId = order.items[0].product.id;
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      });
    });

    // Возвращаем обновлённый заказ с ключом
    const updatedOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { productKey: true, product: true } },
      },
    });

    return {
      id: updatedOrder!.id,
      totalPrice: updatedOrder!.totalPrice.toString(),
      status: updatedOrder!.status,
      createdAt: updatedOrder!.createdAt,
      items: updatedOrder!.items.map((item) => ({
        id: item.id,
        price: item.price.toString(),
        productKey: {
          id: item.productKey.id,
          keyValue: item.productKey.keyValue,
        },
        product: {
          id: item.product.id,
          title: item.product.title,
          price: item.product.price.toString(),
        },
      })),
    };
  }
 
   // Отменить заказ (если ещё не оплачен) и вернуть ключ в пул.
   // Создаёт уведомление об отмене, если notificationService передан.
  async cancelOrder(orderId: number, buyerId: number) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { productKey: true } } },
    });

    if (!order || order.buyerId !== buyerId) {
      throw new Error('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== 'created') {
      throw new Error('Нельзя отменить оплаченный или уже отменённый заказ');
    }

    const productKey = order.items[0].productKey;

    await prisma.$transaction(async (tx) => {
      // 1. Удаляем все OrderItem для этого заказа (освобождаем unique constraint)
      await tx.orderItem.deleteMany({
        where: { orderId: orderId },
      });

      // 2. Возвращаем ключ в пул
      await tx.productKey.update({
        where: { id: productKey.id },
        data: { isSold: false },
      });

      // 3. Меняем статус заказа
      await tx.order.update({
        where: { id: orderId },
        data: { status: 'cancelled' },
      });
    });

    // Создаём in-app уведомление об отмене
    if (this.notificationService) {
      try {
        await this.notificationService.create(
          buyerId,
          'order_cancelled',
          `Заказ №${orderId} отменён.`
        );
      } catch (err) {
        console.error('Ошибка создания уведомления:', err);
      }
    }

    return { success: true };
  }

   // Получить список заказов текущего пользователя (как покупателя).
   // Поддерживает пагинацию и фильтр по статусу.
  async getMyOrders(userId: number, page: number, limit: number, status?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { buyerId: userId };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: { product: true, productKey: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
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
          // Ключ показываем только для оплаченных заказов
          ...(order.status === 'delivered' && item.productKey
            ? {
              productKey: {
                id: item.productKey.id,
                keyValue: item.productKey.keyValue,
              },
            }
            : {}),
        })),
      })),
      total,
      page,
      limit,
    };
  }

   // Получить список заказов, где пользователь является продавцом.
  async getMySales(sellerId: number, page: number, limit: number, status?: string) {
    // Находим все товары этого продавца
    const productIds = await prisma.product.findMany({
      where: { sellerId },
      select: { id: true },
    });
    const ids = productIds.map((p) => p.id);

    if (ids.length === 0) {
      return { orders: [], total: 0, page, limit };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {
      items: { some: { productId: { in: ids } } },
    };
    if (status) where.status = status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, email: true } },
          items: {
            include: { product: true, productKey: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((order) => ({
        id: order.id,
        totalPrice: order.totalPrice.toString(),
        status: order.status,
        createdAt: order.createdAt,
        buyer: order.buyer,
        items: order.items.map((item) => ({
          id: item.id,
          price: item.price.toString(),
          product: {
            id: item.product.id,
            title: item.product.title,
            price: item.product.price.toString(),
          },
          ...(order.status === 'delivered' && item.productKey
            ? {
              productKey: {
                id: item.productKey.id,
                keyValue: item.productKey.keyValue,
              },
            }
            : {}),
        })),
      })),
      total,
      page,
      limit,
    };
  }
}