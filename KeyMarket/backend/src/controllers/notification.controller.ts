// Контроллер уведомлений
// Обрабатывает получение непрочитанных уведомлений и отметку их как прочитанных
import { FastifyRequest } from 'fastify';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

   // GET /notifications — получить непрочитанные уведомления текущего пользователя
  getUnread = async (req: FastifyRequest) => {
    const userId = req.session.get('user')!.id; // пользователь гарантированно авторизован
    return this.notificationService.getUnread(userId);
  };

   // POST /notifications/read — отметить уведомления как прочитанные
  markAsRead = async (req: FastifyRequest<{ Body: { ids: number[] } }>) => {
    await this.notificationService.markAsRead(req.body.ids);
    return { success: true };
  };
}