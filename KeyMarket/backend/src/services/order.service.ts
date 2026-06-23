// Сервис заказов — основной процесс покупки
import { prisma } from '../prisma';

const PLATFORM_FEE = 0.05; // комиссия площадки 5%

export class OrderService {
   // Создать заказ, списать баланс покупателя, выдать ключ.
   // Возвращает созданный заказ с ключом в виде, готовом для JSON.
  async createOrder(buyerId: number, productId: number) {
    // Проверяем товар и наличие ключей
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

    const totalPrice = product.price;

    // Проверяем баланс покупателя
    const buyer = await prisma.user.findUnique({ where: { id: buyerId } });
    if (!buyer) {
      throw new Error('Пользователь не найден');
    }
    if (buyer.balance.lessThan(totalPrice)) {
      throw new Error('Недостаточно средств на балансе');
    }

    // Выполняем в транзакции:
    const order = await prisma.$transaction(async (tx) => {
      // Списываем с покупателя
      await tx.user.update({
        where: { id: buyerId },
        data: { balance: { decrement: totalPrice } },
      });

      // Начисляем продавцу с учётом комиссии
      const sellerAmount = totalPrice.mul(1 - PLATFORM_FEE);
      await tx.user.update({
        where: { id: product.sellerId },
        data: { balance: { increment: sellerAmount } },
      });

      // Помечаем ключ как проданный
      await tx.productKey.update({
        where: { id: availableKey.id },
        data: { isSold: true },
      });

      // Уменьшаем сток товара
      await tx.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      });

      // Создаём заказ
      const newOrder = await tx.order.create({
        data: {
          buyerId,
          totalPrice,
          status: 'delivered',
          items: {
            create: {
              productId,
              productKeyId: availableKey.id,
              price: totalPrice,
            },
          },
        },
        include: {
          items: {
            include: { productKey: true, product: true },
          },
        },
      });

      // Получаем или создаём системного пользователя для учёта комиссии
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
            userId: buyerId,
            type: 'purchase',
            amount: totalPrice.negated(),
            orderId: newOrder.id,
          },
          {
            userId: product.sellerId,
            type: 'sale',
            amount: sellerAmount,
            orderId: newOrder.id,
          },
          {
            userId: systemUser.id,
            type: 'commission',
            amount: totalPrice.minus(sellerAmount),
            orderId: newOrder.id,
          },
        ],
      });

      return newOrder;
    }); // конец транзакции

    // Преобразуем Decimal в строки для безопасного JSON
    return {
      id: order.id,
      totalPrice: order.totalPrice.toString(),
      status: order.status,
      createdAt: order.createdAt,
      items: order.items.map((item: {
        id: number;
        price: { toString: () => string };
        productKey: { id: number; keyValue: string };
        product: { id: number; title: string; price: { toString: () => string } };
      }) => ({
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
}