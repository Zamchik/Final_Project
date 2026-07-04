// Сервис кошелька
import { PrismaClient } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../common/errors';

export class WalletService {
  constructor(private prisma: PrismaClient) { }

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    return { balance: user.balance };
  }

  async replenish(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestError('Сумма пополнения должна быть положительной');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { increment: amount } },
    });
    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'REPLENISH',
        amount,
      },
    });
    return { balance: user.balance.add(amount) };
  }

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestError('Сумма вывода должна быть положительной');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (user.balance.lessThan(amount)) throw new BadRequestError('Недостаточно средств для вывода');
    await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });
    await this.prisma.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        amount,
      },
    });
    return { balance: user.balance.minus(amount) };
  }
}