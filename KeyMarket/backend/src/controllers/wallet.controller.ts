// Контроллер для операций с кошельком
import { FastifyRequest, FastifyReply } from 'fastify';
import { WalletService } from '../services/wallet.service';

export class WalletController {
    constructor(private walletService: WalletService) { }
    // GET /wallet — получить баланс текущего пользователя
    getBalance = async (req: FastifyRequest, reply: FastifyReply) => {
        const userId = req.session.get('user')?.id;
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        try {
            const result = await this.walletService.getBalance(userId);
            return result;
        } catch (err) {
            reply.status(400).send({ error: (err as Error).message });
        }
    };

    // POST /wallet/replenish — пополнить баланс
    replenish = async (req: FastifyRequest<{ Body: { amount: number } }>, reply: FastifyReply) => {
        const userId = req.session.get('user')?.id;
        if (!userId) return reply.status(401).send({ error: 'Unauthorized' });
        const { amount } = req.body;
        try {
            const result = await this.walletService.replenish(userId, Number(amount));
            return result;
        } catch (err) {
            reply.status(400).send({ error: (err as Error).message });
        }
    };
}