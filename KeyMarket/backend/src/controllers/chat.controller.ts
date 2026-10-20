import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '../services/chat.service';
import { UnauthorizedError, BadRequestError, ForbiddenError } from '../common/errors';
import { prisma } from '../prisma';

export class ChatController {
  constructor(private chatService: ChatService) { }

  // GET /chat/conversations — мои диалоги
  getConversations = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.chatService.getUserConversations(userId);
  };

  // POST /chat/order/:orderId — создать/получить чат заказа
  getOrderChat = async (req: FastifyRequest, reply: FastifyReply) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { orderId } = req.params as any;

    // Получаем заказ вместе с продавцом товара
    const order = await prisma.order.findUnique({
      where: { id: Number(orderId) },
      include: { items: { include: { product: { select: { sellerId: true } } } } },
    });

    if (!order) throw new BadRequestError('Заказ не найден');

    const sellerId = order.items[0]?.product.sellerId;
    if (order.buyerId !== userId && sellerId !== userId) {
      throw new BadRequestError('Нет доступа');
    }

    const conv = await this.chatService.findOrCreateOrderChat(
      Number(orderId),
      order.buyerId,
      sellerId!
    );
    return conv;
  };

  // POST /chat/support — создать/получить тикет поддержки
  getSupportChat = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.chatService.findOrCreateSupportChat(userId);
  };

  // GET /admin/chat/tickets — все тикеты поддержки (для админа)
  getSupportTickets = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new ForbiddenError('Только для администраторов');
    }

    const tickets = await prisma.conversation.findMany({
      where: { type: 'SUPPORT' },
      include: {
        user: { select: { id: true, email: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return tickets.map((t) => ({
      id: t.id,
      userId: t.userId,
      user: t.user ? { id: t.user.id, email: t.user.email } : null,
      unreadAdmin: t.unreadAdmin,
      updatedAt: t.updatedAt,
      lastMessage: t.messages[0]?.text || null,
    }));
  };

  // GET /chat/:id/messages — сообщения диалога
  getMessages = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const { page = 1, limit = 50 } = req.query as any;
    return this.chatService.getMessages(Number(id), Number(page), Number(limit));
  };

  // POST /chat/:id/messages — отправить сообщение
  sendMessage = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const { text } = req.body as any;
    if (!text || !text.trim()) throw new BadRequestError('Текст не может быть пустым');

    const msg = await this.chatService.sendMessage(Number(id), userId, text);

    // Рассылаем всем подписанным WebSocket-клиентам в комнате
    const wsRooms = (req.server as any).wsRooms as Map<number, Set<any>>;
    const sockets = wsRooms.get(Number(id));
    if (sockets) {
      const payload = JSON.stringify({ type: 'new_message', message: msg });
      for (const sock of sockets) {
        if (sock.readyState === 1) {
          sock.send(payload);
        }
      }
    }

    return msg;
  };

  // PUT /chat/:id/read — пометить прочитанным
  markRead = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    await this.chatService.markRead(Number(id), userId);
    return { success: true };
  };
}