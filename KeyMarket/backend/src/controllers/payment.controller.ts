// Контроллер для платёжных операций
import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment/payment.service';

export class PaymentController {
    constructor(private paymentService: PaymentService) { }

    // POST /payments/replenish — создать платёж для пополнения баланса  
    createReplenishment = async (
        req: FastifyRequest<{ Body: { amount: number } }>,
        reply: FastifyReply
    ) => {
        const userId = req.session.get('user')?.id;
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        try {
            const result = await this.paymentService.createReplenishment(userId, req.body.amount);
            return result; // вернёт { paymentId, paymentUrl }
        } catch (err) {
            reply.status(400).send({ error: (err as Error).message });
        }
    };

    // POST /payments/webhook — обработчик webhook от платёжного шлюза
    webhook = async (req: FastifyRequest<{ Body: { externalId: string; state: string } }>, reply: FastifyReply) => {
        const { externalId, state } = req.body;
        try {
            if (state === 'paid') {
                await this.paymentService.handlePaymentSuccess(externalId);
                return { success: true };
            }
            return { success: false, message: 'Состояние не обработано' };
        } catch (err) {
            reply.status(400).send({ error: (err as Error).message });
        }
    };

    // POST /orders/:id/create-payment — создать платёж для заказа
    createOrderPayment = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const userId = req.session.get('user')?.id;
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

        try {
            const result = await this.paymentService.createOrderPayment(
                Number(req.params.id),
                userId
            );
            return result; // { paymentId, paymentUrl }
        } catch (err) {
            reply.status(400).send({ error: (err as Error).message });
        }
    };
}