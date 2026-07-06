// Маршруты уведомлений
import { FastifyInstance } from 'fastify';
import { NotificationController } from '../controllers/notification.controller';
import { NotificationService } from '../services/notification.service';

export default async function notificationRoutes(fastify: FastifyInstance) {
  const notificationService = new NotificationService();   // без параметров
  const controller = new NotificationController(notificationService);

  // GET /notifications — непрочитанные
  fastify.get('/', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['notifications'],
      summary: 'Получить непрочитанные уведомления',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              type: { type: 'string' },
              message: { type: 'string' },
              readAt: { type: 'string', nullable: true },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  }, controller.getNotifications);

  // POST /notifications/read — отметить прочитанными
  fastify.post('/read', {
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
            items: { type: 'integer' },
          },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {},   // успех по статусу
        },
      },
    },
  }, controller.markAsRead);
}