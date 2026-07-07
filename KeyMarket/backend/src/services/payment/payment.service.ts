// Сервис управления платежами
import { PrismaClient, PaymentStatus } from '@prisma/client';
import { PaymentGateway } from './payment-gateway.interface';
import { OrderService } from '../order.service';
import { EmailService } from '../email.service';
import { NotificationService } from '../notification.service';
import { NotFoundError, ConflictError } from '../../common/errors';
import { FastifyBaseLogger } from 'fastify/types/logger';


export class PaymentService {
  constructor(
    private prisma: PrismaClient,
    private gateway: PaymentGateway,
    private orderService: OrderService,
    private emailService: EmailService,
    private notificationService: NotificationService,
    private logger: FastifyBaseLogger,
  ) { }

  // Создать платёж для пополнения баланса
  async createReplenishment(userId: number, amount: number) {
    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        status: PaymentStatus.PENDING,
        externalId: '',
      },
    });

    const { externalId, paymentUrl } = await this.gateway.init(payment.id, amount, userId);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { externalId },
    });

    return { paymentId: payment.id, externalId, paymentUrl };
  }

  // Создать платёж для оплаты заказа
  async createOrderPayment(orderId: number, userId: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order || order.buyerId !== userId) {
      throw new NotFoundError('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== 'CREATED') {
      throw new ConflictError('Заказ уже оплачен или отменён');
    }

    const amount = order.totalPrice;

    const payment = await this.prisma.payment.create({
      data: {
        userId,
        amount,
        status: PaymentStatus.PENDING,
        externalId: '',
        orderId,
      },
    });

    const { externalId, paymentUrl } = await this.gateway.init(payment.id, Number(amount), userId);

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { externalId },
    });

    return { paymentId: payment.id, externalId, paymentUrl };
  }

  // Обработать успешную оплату (webhook)
  async handlePaymentSuccess(externalId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { externalId },
      select: { id: true, userId: true, amount: true, status: true, orderId: true },
    });

    if (!payment || payment.status !== PaymentStatus.PENDING) {
      throw new NotFoundError('Платёж не найден или уже обработан');
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: PaymentStatus.COMPLETED },
    });

    if (payment.orderId) {
      // Оплата заказа
      const paidOrder = await this.orderService.payOrder(payment.orderId, payment.userId);

      // Уведомление – асинхронно
      this.notificationService.create(
        payment.userId,
        'ORDER_PAID',
        `Заказ №${paidOrder.id} оплачен. Ключ можно посмотреть в личном кабинете.`
      ).catch(err => this.logger.error('Ошибка создания уведомления:', err));

      // Email с ключом – асинхронно
      const buyer = await this.prisma.user.findUnique({ where: { id: payment.userId } });
      if (buyer && paidOrder.items.length > 0) {
        const productName = paidOrder.items[0].product.title;
        const keyValue = paidOrder.items[0].productKey.keyValue;
        const orderId = paidOrder.id;
        const price = paidOrder.totalPrice;

        this.emailService.send(
          buyer.email,
          `Заказ №${orderId} оплачен!`,
          `<h1>Спасибо за покупку!</h1>
           <p>Ваш заказ <strong>№${orderId}</strong> успешно оплачен.</p>
           <p>Товар: <strong>${productName}</strong></p>
           <p>Ключ: <code>${keyValue}</code></p>
           <p>Сумма: ${price} ₽</p>
           <p>Вы всегда можете найти ключ в личном кабинете → Покупки.</p>`
        ).catch(mailErr => this.logger.error('Ошибка отправки письма о покупке:', mailErr));
      }
    } else {
      // Пополнение баланса (без изменений)
      await this.prisma.user.update({
        where: { id: payment.userId },
        data: { balance: { increment: payment.amount } },
      });

      await this.prisma.transaction.create({
        data: {
          userId: payment.userId,
          type: 'REPLENISH',
          amount: payment.amount,
        },
      });
    }

    return { success: true, amount: payment.amount.toString() };
  }
}