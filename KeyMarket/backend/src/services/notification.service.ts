// Сервис уведомлений
import { prisma } from '../prisma';
import { NotificationType } from '@prisma/client';   

export class NotificationService {
   // Создать уведомление.
  async create(userId: number, type: NotificationType, message: string) {
    return prisma.notification.create({
      data: { userId, type, message },
    });
  }

   // Получить непрочитанные уведомления пользователя.
  async getUnread(userId: number) {
    return prisma.notification.findMany({
      where: { userId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

   // Отметить уведомления как прочитанные
  async markAsRead(ids: number[]) {
    return prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { readAt: new Date() },
    });
  }
}