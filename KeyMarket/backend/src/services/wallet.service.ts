// Сервис управления балансом пользователя (кошелёк)
import { prisma } from '../prisma';

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
}