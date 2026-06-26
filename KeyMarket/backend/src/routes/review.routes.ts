// Маршруты для отзывов
import { FastifyInstance } from 'fastify';
import { ReviewController } from '../controllers/review.controller';
import { ReviewService } from '../services/review.service';

// Тип тела запроса для создания отзыва
interface CreateReviewBody {
    productId: number;
    orderId: number;
    rating: number;
    comment?: string;
}

export default async function reviewRoutes(fastify: FastifyInstance) {
    const reviewService = new ReviewService();
    const controller = new ReviewController(reviewService);

    // Создание отзыва (доступно только авторизованным)
    fastify.post<{ Body: CreateReviewBody }>(
        '/',
        { preHandler: [fastify.authenticate] },
        controller.create
    );

    // Получение отзывов о товаре (публичный)
    fastify.get<{ Params: { id: string }; Querystring: { page?: number; limit?: number } }>(
        '/:id/reviews',
        controller.getByProduct
    );

    // Получение среднего рейтинга товара (публичный)
    fastify.get<{ Params: { id: string } }>(
        '/:id/rating',
        controller.getRating
    );
}