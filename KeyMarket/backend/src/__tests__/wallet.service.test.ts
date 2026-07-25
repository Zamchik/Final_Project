// Тестирование WalletService: баланс, вывод средств, недостаточно средств,
import { WalletService } from '../services/wallet.service';
import { prisma } from '../prisma';

describe('WalletService', () => {
  let walletService: WalletService;
  const testUserId = 3; // buyer@keymarket.local (баланс 0 по умолчанию)

  beforeAll(() => {
    walletService = new WalletService(prisma);
  });

  afterAll(async () => {
    // Возвращаем баланс к исходному состоянию после тестов
    await prisma.user.update({
      where: { id: testUserId },
      data: { balance: 0 },
    });
  });

  // Получение баланса существующего пользователя
  it('должен вернуть баланс пользователя', async () => {
    const result = await walletService.getBalance(testUserId);
    expect(result).toHaveProperty('balance');
    expect(result.balance).toBeDefined();
  });

  // Получение баланса несуществующего пользователя
  it('должен выбросить ошибку при запросе баланса несуществующего пользователя', async () => {
    await expect(walletService.getBalance(99999)).rejects.toThrow('Пользователь не найден');
  });

  // Успешный вывод средств (предварительно пополним баланс через Prisma)
  it('должен успешно вывести средства', async () => {
    // Пополним баланс через прямой запрос (обход сервиса)
    await prisma.user.update({
      where: { id: testUserId },
      data: { balance: 1000 },
    });

    const result = await walletService.withdraw(testUserId, 300);
    expect(result.balance).toBeDefined();

    // Проверим, что баланс уменьшился
    const updatedUser = await prisma.user.findUnique({ where: { id: testUserId } });
    expect(Number(updatedUser!.balance)).toBe(700);
  });

  // Вывод суммы, превышающей баланс
  it('должен выбросить ошибку при недостатке средств', async () => {
    await expect(
      walletService.withdraw(testUserId, 99999)
    ).rejects.toThrow('Недостаточно средств для вывода');
  });

  // Вывод отрицательной суммы
  it('должен выбросить ошибку при отрицательной сумме вывода', async () => {
    await expect(
      walletService.withdraw(testUserId, -100)
    ).rejects.toThrow('Сумма вывода должна быть положительной');
  });
});