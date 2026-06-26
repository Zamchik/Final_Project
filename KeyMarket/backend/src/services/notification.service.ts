// ============================================================================
// Сервис уведомлений
// ============================================================================

import { prisma } from '../prisma';

export class NotificationService {
  /**
   * Создать уведомление для пользователя.
   */
  async create(userId: number, type: string, message: string) {
    return prisma.notification.create({
      data: { userId, type, message },
    });
  }

  /**
   * Получить непрочитанные уведомления пользователя.
   */
  async getUnread(userId: number) {
    return prisma.notification.findMany({
      where: { userId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Отметить уведомления как прочитанные.
   */
  async markAsRead(ids: number[]) {
    return prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });
  }
}