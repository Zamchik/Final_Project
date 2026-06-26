// Маршруты для уведомлений
import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';

// Тип тела запроса для отметки прочитанных
interface MarkAsReadBody {
  ids: number[];
}

export default async function notificationRoutes(fastify: FastifyInstance) {
  const notificationService = fastify.notificationService;
  const controller = new NotificationController(notificationService);

  // GET /notifications — непрочитанные уведомления
  fastify.get(
    '/',
    { preHandler: [fastify.authenticate] },
    controller.getUnread
  );

  // POST /notifications/read — отметить прочитанными
  fastify.post<{ Body: MarkAsReadBody }>(
    '/read',
    { preHandler: [fastify.authenticate] },
    controller.markAsRead
  );
}