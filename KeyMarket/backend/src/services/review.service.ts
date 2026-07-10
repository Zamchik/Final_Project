import { PrismaClient, OrderStatus } from '@prisma/client';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../common/errors';

export class ReviewService {
  constructor(private prisma: PrismaClient) { }

  async create(userId: number, productId: number, orderId: number, rating: number, comment?: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.buyerId !== userId)
      throw new NotFoundError('Заказ не найден или не принадлежит вам');
    if (order.status !== OrderStatus.PAID && order.status !== OrderStatus.DELIVERED) {
      throw new ForbiddenError('Отзыв можно оставить только после завершения заказа');
    }

    const item = await this.prisma.orderItem.findFirst({
      where: { orderId, productId },
    });
    if (!item) throw new NotFoundError('Товар не найден в заказе');

    const existing = await this.prisma.review.findUnique({ where: { orderId } });
    if (existing) throw new ConflictError('Отзыв для этого заказа уже оставлен');

    if (rating < 1 || rating > 5) throw new BadRequestError('Оценка должна быть от 1 до 5');

    const review = await this.prisma.review.create({
      data: { userId, productId, orderId, rating, comment: comment || '' },
      include: { user: { select: { email: true } } },
    });

    // Обновляем средний рейтинг товара
    const aggregation = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: { rating: aggregation._avg.rating ?? 0 },
    });

    return review;
  }

  async getByProduct(productId: number, page: number, limit: number) {
    const where = { productId };
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { user: { select: { email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count({ where }),
    ]);
    return { reviews, total, page, limit };
  }

  // все отзывы (пагинация)
  async getAll(page: number, limit: number) {
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        include: { user: { select: { email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.count(),
    ]);
    return { reviews, total, page, limit };
  }

  async getAverageRating(productId: number) {
    const result = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    return {
      average: result._avg.rating || 0,
      count: result._count.rating,
    };
  }
}