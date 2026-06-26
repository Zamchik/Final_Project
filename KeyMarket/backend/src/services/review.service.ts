// Сервис для работы с отзывами
import { prisma } from '../prisma';

export class ReviewService {
  /**
   * Создать отзыв о товаре после успешной покупки.
   * @param userId - ID покупателя
   * @param productId - ID товара
   * @param orderId - ID завершённого заказа
   * @param rating - оценка (1-5)
   * @param comment - текст отзыва (опционально)
   */
  async create(userId: number, productId: number, orderId: number, rating: number, comment?: string) {
    // Проверяем, что заказ принадлежит пользователю и выполнен
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order || order.buyerId !== userId) {
      throw new Error('Заказ не найден или не принадлежит вам');
    }
    if (order.status !== 'delivered') {
      throw new Error('Отзыв можно оставить только после завершения заказа');
    }

    // Проверяем, что товар действительно был в заказе
    const itemInOrder = order.items.some(
      (item) => item.productId === productId
    );
    if (!itemInOrder) {
      throw new Error('Товар не найден в заказе');
    }

    // Проверяем, что отзыв ещё не оставлялся для этого заказа
    const existingReview = await prisma.review.findUnique({
      where: { orderId },
    });
    if (existingReview) {
      throw new Error('Отзыв для этого заказа уже оставлен');
    }

    // Проверяем рейтинг
    if (rating < 1 || rating > 5) {
      throw new Error('Оценка должна быть от 1 до 5');
    }

    // Создаём отзыв и обновляем средний рейтинг товара в одной транзакции
    const review = await prisma.$transaction(async (tx) => {
      // Создаём отзыв
      const newReview = await tx.review.create({
        data: {
          userId,
          productId,
          orderId,
          rating,
          comment: comment || '',
        },
      });

      // Пересчитываем средний рейтинг товара
      const aggregation = await tx.review.aggregate({
        where: { productId },
        _avg: { rating: true },
      });
      const avgRating = aggregation._avg.rating || 0;

      await tx.product.update({
        where: { id: productId },
        data: { rating: avgRating },
      });

      return newReview;
    });

    return review;
  }

  /**
   * Получить список отзывов для товара с пагинацией.
   * @param productId - ID товара
   * @param page - страница
   * @param limit - количество на странице
   */
  async getByProduct(productId: number, page: number, limit: number) {
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId },
        include: {
          user: { select: { id: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.review.count({ where: { productId } }),
    ]);

    return {
      reviews: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
        user: { id: r.user.id, email: r.user.email },
      })),
      total,
      page,
      limit,
    };
  }

  /**
   * Получить средний рейтинг товара.
   * @param productId - ID товара
   */
  async getAverageRating(productId: number) {
    const aggregation = await prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: aggregation._avg.rating || 0,
      count: aggregation._count.rating || 0,
    };
  }
}