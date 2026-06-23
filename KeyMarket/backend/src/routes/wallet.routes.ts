// Маршруты кошелька (пополнение, вывод, баланс)
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
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    controller.getBalance
  );

  // POST /wallet/replenish — пополнение (доступно всем авторизованным)
  fastify.post<{ Body: AmountBody }>(
    '/replenish',
    { preHandler: [fastify.authenticate] },
    controller.replenish
  );

  // POST /wallet/withdraw — вывод средств (только для продавца)
  fastify.post<{ Body: AmountBody }>(
    '/withdraw',
    { preHandler: [fastify.authenticate, requireRole('seller')] },
    controller.withdraw
  );
}