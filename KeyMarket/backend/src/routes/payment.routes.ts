// ============================================================================
// Маршруты для платежей
// ============================================================================

import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment/payment.service';
import { MockPaymentGateway } from '../services/payment/mock-payment-gateway';
import { OrderService } from '../services/order.service';

export default async function paymentRoutes(fastify: FastifyInstance) {
  const mockGateway = new MockPaymentGateway();
  const orderService = new OrderService();
  const emailService = fastify.emailService;
  const notificationService = fastify.notificationService;
  const paymentService = new PaymentService(mockGateway, orderService, emailService, notificationService);
  const controller = new PaymentController(paymentService); // ← добавлено

  // Пополнение баланса
  fastify.post<{ Body: { amount: number } }>(
    '/replenish',
    { preHandler: [fastify.authenticate] },
    controller.createReplenishment
  );

  // Оплата заказа
  fastify.post<{ Params: { id: string } }>(
    '/orders/:id/create-payment',
    { preHandler: [fastify.authenticate] },
    controller.createOrderPayment
  );

  // Webhook
  fastify.post(
    '/webhook',
    controller.webhook
  );
}