// Маршруты для платежей
import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment/payment.service';
import { OrderService } from '../services/order.service';
import { MockPaymentGateway } from '../services/payment/mock-payment-gateway';

export default async function paymentRoutes(fastify: FastifyInstance) {
  const mockGateway = new MockPaymentGateway();
  const orderService = new OrderService();
  const emailService = fastify.emailService;
  const notificationService = fastify.notificationService;
  const paymentService = new PaymentService(mockGateway, orderService, emailService, notificationService);

  // POST /payments/replenish — создать платёж для пополнения баланса
  fastify.post('/replenish', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['payments'],
      summary: 'Создать платёж для пополнения баланса (mock)',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', description: 'Сумма пополнения' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            paymentId: { type: 'number' },
            externalId: { type: 'string' },
            paymentUrl: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        // добавил статус 401 для случаев когда сессия невалидна
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { amount } = request.body as { amount: number };

    // Проверяем, что пользователь авторизован
    const sessionUser = request.session.user;
    if (!sessionUser) {
      return reply.status(401).send({ error: 'Не авторизован' });
    }

    const result = await paymentService.createReplenishment(sessionUser.id, amount);
    return result;
  });

  // POST /payments/webhook — имитация callback от платёжного шлюза
  fastify.post('/webhook', {
    schema: {
      tags: ['payments'],
      summary: 'Webhook для обработки результата платежа (mock)',
      body: {
        type: 'object',
        required: ['externalId'],
        properties: {
          externalId: { type: 'string' },
        },
      },
      response: {
        200: { type: 'object', properties: { success: { type: 'boolean' } } },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { externalId } = request.body as { externalId: string };
    try {
      await mockGateway.confirm(externalId);
      await paymentService.handlePaymentSuccess(externalId);
      return { success: true };
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  });
}