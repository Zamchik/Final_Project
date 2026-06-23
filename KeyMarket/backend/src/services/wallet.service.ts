// Сервис управления балансом пользователя (кошелёк)
import { prisma } from '../prisma';
import { Prisma } from '@prisma/client';

export class WalletService {
    // Получить текущий баланс пользователя.
    async getBalance(userId: number) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Пользователь не найден');
        return { balance: user.balance };
    }

    // Пополнить баланс пользователя (эмуляция платежа).
    async replenish(userId: number, amount: number) {
        if (amount <= 0) throw new Error('Сумма пополнения должна быть положительной');
        // Атомарно увеличиваем баланс
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
        });
        // Опционально можно записать транзакцию в лог (позже)
        return { balance: updatedUser.balance };
    }

    // Запрос на вывод средств (имитация).
    // Списывает указанную сумму с баланса и создаёт транзакцию.
    async withdraw(userId: number, amount: number) {
        if (amount <= 0) throw new Error('Сумма вывода должна быть положительной');

        // Получаем актуальный баланс
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error('Пользователь не найден');

        if (user.balance.lessThan(amount)) {
            throw new Error('Недостаточно средств для вывода');
        }

        // Атомарно списываем и создаём транзакцию
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } },
            }),
            prisma.transaction.create({
                data: {
                    userId,
                    type: 'withdrawal',
                    amount: new Prisma.Decimal(amount).negated(), // отрицательная сумма
                },
            }),
        ]);

        return {
            balance: updatedUser.balance.toString(),
            transactionId: transaction.id,
        };
    }
}