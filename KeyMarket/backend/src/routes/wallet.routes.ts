// Маршруты кошелька (вывод, баланс)
import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/wallet.controller';
import { WalletService } from '../services/wallet.service';
import { prisma } from '../prisma';
import { requireRole } from '../middleware/auth';

export default async function walletRoutes(fastify: FastifyInstance) {
  const walletService = new WalletService(prisma);
  const controller = new WalletController(walletService);

  // GET /wallet — баланс
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['wallet'],
      summary: 'Получить текущий баланс пользователя',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            balance: { type: 'string' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.getBalance);

  // POST /wallet/withdraw — вывод средств (только для продавца)
  fastify.post('/withdraw', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['wallet'],
      summary: 'Запросить вывод средств (эмуляция)',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            balance: { type: 'string' },
            transactionId: { type: 'integer' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.withdraw);
}