// Маршруты для платежей
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
  const controller = new PaymentController(paymentService);

  // POST /payments/replenish — пополнение баланса
  fastify.post<{ Body: { amount: number } }>('/replenish', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['payments'],
      summary: 'Создать платёж для пополнения баланса',
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
            paymentUrl: { type: 'string', description: 'Ссылка на страницу имитации оплаты' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.createReplenishment);

  // POST /payments/orders/:id/create-payment — оплата заказа
  fastify.post<{ Params: { id: string } }>('/orders/:id/create-payment', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['payments'],
      summary: 'Создать платёж для оплаты заказа',
      security: [{ cookieAuth: [] }],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string', description: 'ID заказа' },
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
      },
    },
  }, controller.createOrderPayment);

  // POST /payments/webhook — webhook
  fastify.post('/webhook', {
    schema: {
      tags: ['payments'],
      summary: 'Обработчик webhook от платёжного шлюза',
      body: {
        type: 'object',
        required: ['externalId', 'state'],
        properties: {
          externalId: { type: 'string', description: 'ID платежа в шлюзе' },
          state: { type: 'string', enum: ['paid', 'cancelled'], description: 'Новый статус' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.webhook);
}