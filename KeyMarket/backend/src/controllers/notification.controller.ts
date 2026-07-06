// Контроллер уведомлений
import { FastifyRequest } from 'fastify';
import { NotificationService } from '../services/notification.service';
import { UnauthorizedError } from '../common/errors';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  // GET /notifications — получить непрочитанные уведомления
  getNotifications = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.notificationService.getUnread(userId);
  };

  // POST /notifications/read — отметить прочитанными
  markAsRead = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { ids } = req.body as any;
    await this.notificationService.markAsRead(ids);
    return {};
  };
}