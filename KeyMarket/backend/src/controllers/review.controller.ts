// Контроллер для работы с отзывами
import { FastifyRequest, FastifyReply } from 'fastify';
import { ReviewService } from '../services/review.service';

export class ReviewController {
  constructor(private reviewService: ReviewService) {}

   // POST /reviews — создать отзыв о товаре
  create = async (req: FastifyRequest<{ Body: { productId: number; orderId: number; rating: number; comment?: string } }>, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) return reply.status(401).send({ error: 'Unauthorized' });

    const { productId, orderId, rating, comment } = req.body;

    try {
      const review = await this.reviewService.create(userId, productId, orderId, rating, comment);
      reply.status(201).send(review);
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

   // GET /products/:id/reviews — получить отзывы о товаре
  getByProduct = async (req: FastifyRequest<{ Params: { id: string }; Querystring: { page?: number; limit?: number } }>, reply: FastifyReply) => {
    const productId = Number(req.params.id);
    const { page = 1, limit = 10 } = req.query;
    return this.reviewService.getByProduct(productId, Number(page), Number(limit));
  };

   // GET /products/:id/rating — получить средний рейтинг товара
  getRating = async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const productId = Number(req.params.id);
    return this.reviewService.getAverageRating(productId);
  };
}