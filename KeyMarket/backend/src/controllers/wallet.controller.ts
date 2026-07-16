// Контроллер для операций с кошельком
import { FastifyRequest } from 'fastify';
import { WalletService } from '../services/wallet.service';
import { UnauthorizedError } from '../common/errors';

 // Контроллер кошелька.
 // Обрабатывает получение баланса и вывод средств.
export class WalletController {
  constructor(private walletService: WalletService) {}

   // GET /wallet — получить текущий баланс пользователя.
  getBalance = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.walletService.getBalance(userId);
  };

   // POST /wallet/withdraw — запросить вывод средств (только для продавца).
  withdraw = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { amount } = req.body as any;
    return this.walletService.withdraw(userId, amount);
  };
}