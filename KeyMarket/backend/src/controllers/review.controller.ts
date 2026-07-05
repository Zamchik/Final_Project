import { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from '../services/review.service';
import { UnauthorizedError } from '../common/errors';

 // Контроллер отзывов.
 // Обрабатывает создание отзыва о товаре.
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

   // POST /reviews — создать отзыв.
   // Требует завершённый заказ, рейтинг от 1 до 5.
  create = async (req: FastifyRequest<{ Body: { productId: number; orderId: number; rating: number; comment?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');

    const { productId, orderId, rating, comment } = req.body;
    const review = await this.reviewService.create(userId, productId, orderId, rating, comment);
    reply.status(201).send(review);
  };
}