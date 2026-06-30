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
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['notifications'],
      summary: 'Получить непрочитанные уведомления текущего пользователя',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number' },
              type: { type: 'string', description: 'Тип уведомления (welcome, order_paid, order_cancelled)' },
              message: { type: 'string' },
              isRead: { type: 'boolean' },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, controller.getUnread);

  // POST /notifications/read — отметить прочитанными
  fastify.post<{ Body: MarkAsReadBody }>('/read', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['notifications'],
      summary: 'Отметить уведомления как прочитанные',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['ids'],
        properties: {
          ids: {
            type: 'array',
            items: { type: 'number' },
            description: 'Массив ID уведомлений',
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
          },
        },
      },
    },
  }, controller.markAsRead);
}