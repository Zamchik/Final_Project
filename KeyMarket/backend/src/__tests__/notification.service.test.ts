// Тестирование NotificationService: создание, получение непрочитанных,
import { NotificationService } from '../services/notification.service';
import { prisma } from '../prisma';

describe('NotificationService', () => {
  let notificationService: NotificationService;
  const userId = 3; // buyer

  beforeAll(() => {
    notificationService = new NotificationService();
  });

  afterAll(async () => {
    // Удаляем все уведомления, созданные тестами
    await prisma.notification.deleteMany({ where: { userId } });
  });

  it('должен создать уведомление', async () => {
    const notif = await notificationService.create(userId, 'WELCOME', 'Добро пожаловать!');
    expect(notif).toHaveProperty('id');
    expect(notif.type).toBe('WELCOME');
    expect(notif.message).toBe('Добро пожаловать!');
  });

  it('должен получить непрочитанные уведомления', async () => {
    // Создадим ещё одно
    await notificationService.create(userId, 'ORDER_PAID', 'Заказ оплачен');
    const unread = await notificationService.getUnread(userId);
    expect(unread.length).toBeGreaterThanOrEqual(2);
    // Все должны быть непрочитанными (readAt = null)
    expect(unread.every(n => n.readAt === null)).toBe(true);
  });

  it('должен отметить уведомления как прочитанные', async () => {
    const unread = await notificationService.getUnread(userId);
    const ids = unread.map(n => n.id);
    await notificationService.markAsRead(ids);

    // Проверим, что они теперь прочитаны
    const after = await prisma.notification.findMany({
      where: { id: { in: ids } },
    });
    expect(after.every(n => n.readAt !== null)).toBe(true);
  });
});