import { FastifyRequest, FastifyReply } from 'fastify';
import { ChatService } from '../services/chat.service';
import { UnauthorizedError, BadRequestError } from '../common/errors';

export class ChatController {
  constructor(private chatService: ChatService) {}

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
    // В идеале проверить, что пользователь является покупателем или продавцом заказа
    const order = await (this.chatService as any).prisma.order.findUnique({ where: { id: Number(orderId) } });
    if (!order || (order.buyerId !== userId && order.sellerId !== (await (this.chatService as any).prisma.product.findUnique({ where: { id: order.id } }))?.sellerId)) {
      throw new BadRequestError('Нет доступа');
    }
    // Для простоты используем buyerId и sellerId из заказа
    const conv = await this.chatService.findOrCreateOrderChat(Number(orderId), order.buyerId, order.sellerId);
    return conv;
  };

  // POST /chat/support — создать/получить тикет поддержки
  getSupportChat = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    return this.chatService.findOrCreateSupportChat(userId);
  };

  // GET /chat/:id/messages — сообщения диалога
  getMessages = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const { page = 1, limit = 50 } = req.query as any;
    return this.chatService.getMessages(Number(id), Number(page), Number(limit));
  };

  // POST /chat/:id/messages — отправить сообщение (REST, но также будет WS)
  sendMessage = async (req: FastifyRequest) => {
    const userId = req.session.get('user')?.id;
    if (!userId) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const { text } = req.body as any;
    if (!text || !text.trim()) throw new BadRequestError('Текст не может быть пустым');
    return this.chatService.sendMessage(Number(id), userId, text);
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