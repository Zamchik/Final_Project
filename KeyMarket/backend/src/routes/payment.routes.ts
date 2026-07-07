// Маршруты для платежей
import { FastifyInstance } from 'fastify';
import { PaymentService } from '../services/payment/payment.service';
import { OrderService } from '../services/order.service';
import { MockPaymentGateway } from '../services/payment/mock-payment-gateway';
import { prisma } from '../prisma';

export default async function paymentRoutes(fastify: FastifyInstance) {
  const mockGateway = new MockPaymentGateway();
  const orderService = new OrderService(prisma);
  const emailService = fastify.emailService;
  const notificationService = fastify.notificationService;
  // Используем fastify.log, а не fastify.logger
  const paymentService = new PaymentService(prisma, mockGateway, orderService, emailService, notificationService, fastify.log);

  // POST /payments/orders/:orderId/create-payment — оплата заказа
  fastify.post('/orders/:orderId/create-payment', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['payments'],
      summary: 'Создать платёж для оплаты заказа (mock)',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        properties: {
          orderId: { type: 'integer' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            paymentId: { type: 'integer' },
            externalId: { type: 'string' },
            paymentUrl: { type: 'string' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { orderId } = request.params as any;
    const userId = request.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    try {
      const result = await paymentService.createOrderPayment(orderId, userId);
      return result;
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
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
        200: {
          type: 'object',
          properties: {
            // пустой объект, успех определяется статусом
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, async (request, reply) => {
    const { externalId } = request.body as any;
    try {
      await mockGateway.confirm(externalId);
      await paymentService.handlePaymentSuccess(externalId);
      return {};
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  });
}