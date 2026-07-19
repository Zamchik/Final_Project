// Тестирование ReviewService.
import { ReviewService } from '../services/review.service';
import { prisma } from '../prisma';

describe('ReviewService', () => {
  let reviewService: ReviewService;
  const buyerId = 3;
  const sellerId = 2;
  const productId = 1;

  beforeAll(() => {
    reviewService = new ReviewService(prisma);
  });

  // Вспомогательная функция для создания заказа с новым ключом
  const createOrderWithNewKey = async (status: 'CREATED' | 'DELIVERED', buyer: number = buyerId) => {
    // Создаём уникальный ключ для этого заказа
    const uniqueKey = `TEST-KEY-${Date.now()}-${Math.random()}`;
    const productKey = await prisma.productKey.create({
      data: { productId, keyValue: uniqueKey },
    });

    const order = await prisma.order.create({
      data: {
        buyerId: buyer,
        totalPrice: 1999,
        status,
        items: {
          create: {
            productId,
            productKeyId: productKey.id,
            price: 1999,
          },
        },
      },
      include: { items: true },
    });
    return { order, productKey };
  };

  afterAll(async () => {
    // Удаляем все тестовые заказы и ключи
    const testKeys = await prisma.productKey.findMany({ where: { keyValue: { startsWith: 'TEST-KEY-' } } });
    for (const key of testKeys) {
      await prisma.orderItem.deleteMany({ where: { productKeyId: key.id } });
      await prisma.productKey.delete({ where: { id: key.id } });
    }
    await prisma.order.deleteMany({ where: { buyerId } });
  });

  it('должен создать отзыв и обновить рейтинг товара', async () => {
    const { order } = await createOrderWithNewKey('DELIVERED');
    const review = await reviewService.create(buyerId, productId, order.id, 5, 'Отличный товар!');
    expect(review).toHaveProperty('id');
    expect(review.rating).toBe(5);
  });

  it('должен выбросить ошибку, если заказ не найден', async () => {
    await expect(reviewService.create(buyerId, productId, 99999, 4)).rejects.toThrow('Заказ не найден или не принадлежит вам');
  });

  it('должен выбросить ошибку, если заказ не принадлежит пользователю', async () => {
    const { order } = await createOrderWithNewKey('DELIVERED');
    await expect(reviewService.create(1, productId, order.id, 4)).rejects.toThrow('Заказ не найден или не принадлежит вам');
  });

  it('должен выбросить ошибку, если заказ не завершён', async () => {
    const { order } = await createOrderWithNewKey('CREATED');
    await expect(reviewService.create(buyerId, productId, order.id, 3)).rejects.toThrow('Отзыв можно оставить только после завершения заказа');
  });

  it('должен выбросить ошибку при повторном отзыве на тот же заказ', async () => {
    const { order } = await createOrderWithNewKey('DELIVERED');
    await reviewService.create(buyerId, productId, order.id, 4, 'Первый');
    await expect(reviewService.create(buyerId, productId, order.id, 4, 'Второй')).rejects.toThrow('Отзыв для этого заказа уже оставлен');
  });

  it('должен выбросить ошибку при рейтинге < 1 или > 5', async () => {
    const { order } = await createOrderWithNewKey('DELIVERED');
    await expect(reviewService.create(buyerId, productId, order.id, 0)).rejects.toThrow('Оценка должна быть от 1 до 5');
    // для второго теста нужен новый заказ, т.к. предыдущий уже имеет отзыв
    const { order: order2 } = await createOrderWithNewKey('DELIVERED');
    await expect(reviewService.create(buyerId, productId, order2.id, 6)).rejects.toThrow('Оценка должна быть от 1 до 5');
  });
});