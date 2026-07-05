// Контроллер для платёжных операций
import { FastifyRequest, FastifyReply } from 'fastify';
import { PaymentService } from '../services/payment/payment.service';
import { UnauthorizedError } from '../common/errors';

export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  // POST /payments/replenish
  createReplenishment = async (
    req: FastifyRequest<{ Body: { amount: number } }>,
    reply: FastifyReply
  ) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const result = await this.paymentService.createReplenishment(userId, req.body.amount);
    return result;
  };

  // POST /payments/webhook
  webhook = async (req: FastifyRequest<{ Body: { externalId: string; state: string } }>) => {
    const { externalId, state } = req.body;
    if (state === 'paid') {
      await this.paymentService.handlePaymentSuccess(externalId);
      return { success: true };
    }
    return { success: false, message: 'Состояние не обработано' };
  };

  // POST /orders/:id/create-payment
  createOrderPayment = async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const result = await this.paymentService.createOrderPayment(
      Number(req.params.id),
      userId
    );
    return result;
  };
}