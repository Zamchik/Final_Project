// Сервис для работы с чатами и сообщениями.
import { PrismaClient } from '@prisma/client';
import { EmailService } from './email.service';

export class ChatService {
  constructor(
    private prisma: PrismaClient,
    private emailService?: EmailService   // опционально, чтобы не ломать тесты
  ) {}

  // Найти или создать диалог по заказу (ORDER)
  async findOrCreateOrderChat(orderId: number, buyerId: number, sellerId: number) {
    let conv = await this.prisma.conversation.findFirst({
      where: { type: 'ORDER', orderId },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { type: 'ORDER', orderId, buyerId, sellerId },
      });
    }
    return conv;
  }

  // Найти или создать тикет поддержки
  async findOrCreateSupportChat(userId: number) {
    let conv = await this.prisma.conversation.findFirst({
      where: { type: 'SUPPORT', userId },
    });
    if (!conv) {
      conv = await this.prisma.conversation.create({
        data: { type: 'SUPPORT', userId },
      });
    }
    return conv;
  }

  // Отправить сообщение
  async sendMessage(conversationId: number, senderId: number, text: string) {
    const msg = await this.prisma.message.create({
      data: { conversationId, senderId, text },
      include: { sender: { select: { id: true, email: true } } },
    });

    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new Error('Диалог не найден');

    // Увеличиваем счётчики непрочитанных
    if (conv.type === 'ORDER') {
      if (senderId === conv.buyerId) {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadSeller: { increment: 1 } },
        });
      } else {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadBuyer: { increment: 1 } },
        });
      }
    } else if (conv.type === 'SUPPORT') {
      // Если пишет пользователь — увеличиваем счётчик админа, и наоборот
      if (senderId === conv.userId) {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadAdmin: { increment: 1 } },
        });
      } else {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadBuyer: { increment: 1 } }, // unreadBuyer здесь для пользователя тикета
        });
      }
    }

    // Отправляем email, если это первое непрочитанное сообщение
    if (this.emailService) {
      await this.maybeSendEmailNotification(conv, senderId);
    }

    return msg;
  }

  // Проверяет, нужно ли отправить email-уведомление (только при первом непрочитанном)
  private async maybeSendEmailNotification(conv: any, senderId: number) {
    // Получаем актуальные счётчики после обновления
    const updatedConv = await this.prisma.conversation.findUnique({
      where: { id: conv.id },
    });
    if (!updatedConv) return;

    let recipientId: number | null = null;

    if (updatedConv.type === 'ORDER') {
      // Если продавец написал покупателю и это первое непрочитанное для покупателя
      if (senderId === updatedConv.sellerId && updatedConv.unreadBuyer === 1) {
        recipientId = updatedConv.buyerId;
      }
      // Если покупатель написал продавцу и это первое непрочитанное для продавца
      else if (senderId === updatedConv.buyerId && updatedConv.unreadSeller === 1) {
        recipientId = updatedConv.sellerId;
      }
    } else if (updatedConv.type === 'SUPPORT') {
      // Если пользователь написал в поддержку и это первое непрочитанное для админов
      if (senderId === updatedConv.userId && updatedConv.unreadAdmin === 1) {
        // Для MVP отправим всем ADMIN и SUPER_ADMIN.
        const admins = await this.prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
          select: { id: true, email: true },
        });
        const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
        const subject = 'Новое обращение в поддержку KeyMarket';
        const html = `<p>Пользователь ${sender?.email || 'неизвестный'} написал в поддержку.</p>`;
        for (const admin of admins) {
          await this.emailService!.send(admin.email, subject, html).catch(err =>
            console.error('Ошибка отправки email админу:', err)
          );
        }
        return; // вышли, чтобы не отправлять ещё и обычному пользователю
      }
      // Если админ ответил пользователю и это первое непрочитанное для пользователя
      else if (senderId !== updatedConv.userId && updatedConv.unreadBuyer === 1) {
        recipientId = updatedConv.userId;
      }
    }

    if (recipientId) {
      const user = await this.prisma.user.findUnique({ where: { id: recipientId } });
      if (user) {
        const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
        const subject = 'Новое сообщение в чате KeyMarket';
        const html = `<p>У вас новое сообщение от ${sender?.email || 'пользователя'}.</p><p>Перейдите в личный кабинет, чтобы прочитать.</p>`;
        await this.emailService!.send(user.email, subject, html).catch(err =>
          console.error('Ошибка отправки email:', err)
        );
      }
    }
  }

  // Получить сообщения диалога
  async getMessages(conversationId: number, page: number = 1, limit: number = 50) {
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId },
        include: { sender: { select: { id: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.message.count({ where: { conversationId } }),
    ]);
    return { messages: messages.reverse(), total, page, limit };
  }

  // Пометить сообщения прочитанными для текущего пользователя
  async markRead(conversationId: number, userId: number) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
    });
    if (!conv) throw new Error('Диалог не найден');

    // Сбрасываем соответствующий счётчик
    if (conv.type === 'ORDER') {
      if (userId === conv.buyerId) {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadBuyer: 0 },
        });
      } else {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadSeller: 0 },
        });
      }
    } else if (conv.type === 'SUPPORT') {
      if (userId === conv.userId) {
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadBuyer: 0 },
        });
      } else {
        // Админ читает
        await this.prisma.conversation.update({
          where: { id: conversationId },
          data: { unreadAdmin: 0 },
        });
      }
    }

    // Помечаем все сообщения, где получатель = userId, как прочитанные (readAt = now)
    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });
  }

  // Получить список диалогов для пользователя (с заказами или поддержкой)
  async getUserConversations(userId: number) {
    return this.prisma.conversation.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
          { userId: userId },
        ],
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        order: {
          select: { id: true, status: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}