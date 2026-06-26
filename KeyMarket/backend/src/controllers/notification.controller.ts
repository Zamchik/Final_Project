import { FastifyRequest } from 'fastify';
import { NotificationService } from '../services/notification.service';

export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  getUnread = async (req: FastifyRequest) => {
    const userId = req.session.get('user')!.id;
    return this.notificationService.getUnread(userId);
  };

  markAsRead = async (req: FastifyRequest<{ Body: { ids: number[] } }>) => {
    await this.notificationService.markAsRead(req.body.ids);
    return { success: true };
  };
}