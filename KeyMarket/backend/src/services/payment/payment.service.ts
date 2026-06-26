// Сервис управления платежами
// Использует реализацию PaymentGateway (Mock или реальную)
import { prisma } from '../../prisma';
import { PaymentGateway } from './payment-gateway.interface';
import { OrderService } from '../order.service';
import { EmailService } from '../email.service';
import { NotificationService } from '../notification.service';

export class PaymentService {
  constructor(
    private gateway: PaymentGateway,
    private orderService: OrderService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {}

    // Создать платёж для пополнения баланса.
    // Возвращает ссылку для оплаты.
    async createReplenishment(userId: number, amount: number) {
        const payment = await prisma.payment.create({
            data: {
                userId,
                amount,
                status: 'pending',
                externalId: '',
            },
        });

        const { externalId, paymentUrl } = await this.gateway.init(payment.id, amount, userId);

        await prisma.payment.update({
            where: { id: payment.id },
            data: { externalId },
        });

        return { paymentId: payment.id, externalId, paymentUrl };
    }

    /**
     * Создать платёж для оплаты заказа.
     * @param orderId – ID заказа
     * @param userId – ID покупателя (для проверки владения)
     * @returns ссылка на оплату
     */
    async createOrderPayment(orderId: number, userId: number) {
        const order = await prisma.order.findUnique({
            where: { id: orderId },
        });
        if (!order || order.buyerId !== userId) {
            throw new Error('Заказ не найден или не принадлежит вам');
        }
        if (order.status !== 'created') {
            throw new Error('Заказ уже оплачен или отменён');
        }

        const amount = order.totalPrice;

        const payment = await prisma.payment.create({
            data: {
                userId,
                amount,
                status: 'pending',
                externalId: '',
                orderId,
            },
        });

        const { externalId, paymentUrl } = await this.gateway.init(payment.id, Number(amount), userId);

        await prisma.payment.update({
            where: { id: payment.id },
            data: { externalId },
        });

        return { paymentId: payment.id, externalId, paymentUrl };
    }

    // Обработать успешную оплату (вызывается webhook'ом или подтверждением).
   // При оплате заказа отправляет покупателю email с ключом.
    async handlePaymentSuccess(externalId: string) {
    const payment = await prisma.payment.findUnique({
      where: { externalId },
      select: {
        id: true,
        userId: true,
        amount: true,
        status: true,
        orderId: true,
      },
    });

    if (!payment || payment.status !== 'pending') {
      throw new Error('Платёж не найден или уже обработан');
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'completed' },
    });

    if (payment.orderId) {
      // Оплата заказа
      const paidOrder = await this.orderService.payOrder(payment.orderId, payment.userId);

      // Создаём in-app уведомление
      try {
        await this.notificationService.create(
          payment.userId,
          'order_paid',
          `Заказ №${paidOrder.id} оплачен. Ключ можно посмотреть в личном кабинете.`
        );
      } catch (err) {
        console.error('Ошибка создания уведомления:', err);
      }

      // Отправляем email с ключом
      try {
        const buyer = await prisma.user.findUnique({ where: { id: payment.userId } });
        if (buyer && paidOrder.items.length > 0) {
          const productName = paidOrder.items[0].product.title;
          const keyValue = paidOrder.items[0].productKey.keyValue;
          const orderId = paidOrder.id;
          const price = paidOrder.totalPrice;

          await this.emailService.send(
            buyer.email,
            `Заказ №${orderId} оплачен!`,
            `<h1>Спасибо за покупку!</h1>
             <p>Ваш заказ <strong>№${orderId}</strong> успешно оплачен.</p>
             <p>Товар: <strong>${productName}</strong></p>
             <p>Ключ: <code>${keyValue}</code></p>
             <p>Сумма: ${price} ₽</p>
             <p>Вы всегда можете найти ключ в личном кабинете → Покупки.</p>`
          );
        }
      } catch (mailErr) {
        console.error('Ошибка отправки письма о покупке:', mailErr);
      }
    } else {
      // Пополнение баланса
      await prisma.user.update({
        where: { id: payment.userId },
        data: { balance: { increment: payment.amount } },
      });

      await prisma.transaction.create({
        data: {
          userId: payment.userId,
          type: 'replenish',
          amount: payment.amount,
        },
      });
    }

    return { success: true, amount: payment.amount.toString() };
  }
}