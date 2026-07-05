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
  withdraw = async (req: FastifyRequest<{ Body: { amount: number } }>) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.walletService.withdraw(userId, req.body.amount);
  };
}

   // POST /wallet/replenish — пополнить баланс
    // replenish = async (req: FastifyRequest<{ Body: { amount: number } }>, reply: FastifyReply) => {
    //     const userId = req.session.get('user')?.id;
    //     if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
    //     const { amount } = req.body;
    //     try {
    //         const result = await this.walletService.replenish(userId, Number(amount));
    //         return result;
    //     } catch (err) {
    //         reply.status(400).send({ error: (err as Error).message });
    //     }
    // };
    
    // Пока убрал, изначально планировалось пополнение через кошелёк, но потом решили через платёжную систему.