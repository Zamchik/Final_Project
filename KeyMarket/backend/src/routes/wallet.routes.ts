// Маршруты кошелька (вывод, баланс)
import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/wallet.controller';
import { WalletService } from '../services/wallet.service';
import { requireRole } from '../middleware/auth';

interface AmountBody {
  amount: number;
}

export default async function walletRoutes(fastify: FastifyInstance) {
  const walletService = new WalletService();
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
            balance: { type: 'string', description: 'Текущий баланс' },
          },
        },
        401: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, controller.getBalance);

  // POST /wallet/withdraw — вывод средств (только для продавца)
  fastify.post<{ Body: AmountBody }>('/withdraw', {
    preHandler: [fastify.authenticate, requireRole('seller')],
    schema: {
      tags: ['wallet'],
      summary: 'Запросить вывод средств (эмуляция)',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', description: 'Сумма для вывода' },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            balance: { type: 'string' },
            transactionId: { type: 'number' },
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
  }, controller.withdraw);
}