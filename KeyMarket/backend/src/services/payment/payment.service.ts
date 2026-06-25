// Сервис управления платежами
// Использует реализацию PaymentGateway (Mock или реальную)
import { prisma } from '../../prisma';
import { PaymentGateway } from './payment-gateway.interface';
import { OrderService } from '../order.service';

export class PaymentService {
    constructor(
        private gateway: PaymentGateway,
        private orderService: OrderService
    ) { }

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
    async handlePaymentSuccess(externalId: string) {
        // Явно выбираем поля, которые нам нужны, включая orderId
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
            // Оплата заказа – вызываем закрытие заказа
            await this.orderService.payOrder(payment.orderId, payment.userId);
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