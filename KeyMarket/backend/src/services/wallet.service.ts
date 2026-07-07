import { PrismaClient, TransactionType } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../common/errors';

export class WalletService {
  constructor(private prisma: PrismaClient) {}

  async getBalance(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    return { balance: user.balance };
  }

  async withdraw(userId: number, amount: number) {
    if (amount <= 0) throw new BadRequestError('Сумма вывода должна быть положительной');

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');

    // Сравниваем Decimal с числом, преобразуя Decimal в число
    if (user.balance.lessThan(amount)) {
      throw new BadRequestError('Недостаточно средств для вывода');
    }

    // Обновляем баланс (уменьшаем)
    await this.prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } },
    });

    // Создаём транзакцию вывода
    await this.prisma.transaction.create({
      data: {
        userId,
        type: TransactionType.WITHDRAWAL,
        amount,
      },
    });

    // Возвращаем новый баланс (получаем обновлённого пользователя)
    const updated = await this.prisma.user.findUnique({ where: { id: userId } });
    return { balance: updated!.balance };
  }
}