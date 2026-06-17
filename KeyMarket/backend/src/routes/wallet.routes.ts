// Маршруты кошелька (пополнение, баланс)
import { FastifyInstance } from 'fastify';
import { WalletController } from '../controllers/wallet.controller';
import { WalletService } from '../services/wallet.service';

// Тип для тела запроса пополнения
interface ReplenishBody {
  amount: number;
}

export default async function walletRoutes(fastify: FastifyInstance) {
  const walletService = new WalletService();
  const controller = new WalletController(walletService);

  // Все операции требуют аутентификации
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    controller.getBalance
  );

  fastify.post<{ Body: ReplenishBody }>(
    '/replenish',
    { preHandler: [fastify.authenticate] },
    controller.replenish
  );
}