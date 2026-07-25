import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';

export default async function wsRoutes(fastify: FastifyInstance) {
  fastify.get('/chat', { websocket: true }, async (connection, request) => {
    // Аутентификация: получаем сессию из кук
    const session = request.session?.get('user');
    if (!session) {
      connection.close(1008, 'Unauthorized');
      return;
    }

    const userId = session.id;

    // Обработчик сообщений от клиента
    connection.on('message', async (raw: any) => {
      try {
        const data = JSON.parse(raw.toString());
        // Ожидаем { type: 'subscribe', conversationId: number } или { type: 'message', conversationId, text }
        if (data.type === 'subscribe') {
          const convId = data.conversationId;
          if (!convId) return;
          // Проверим, что пользователь является участником диалога
          const conv = await prisma.conversation.findUnique({ where: { id: convId } });
          if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId && conv.userId !== userId && conv.adminId !== userId)) {
            return;
          }
          // Добавляем сокет в комнату
          const rooms = fastify.wsRooms as Map<number, Set<any>>;
          if (!rooms.has(convId)) rooms.set(convId, new Set());
          rooms.get(convId)!.add(connection);
          // Отправляем подтверждение
          connection.send(JSON.stringify({ type: 'subscribed', conversationId: convId }));
        } else if (data.type === 'message') {
          const { conversationId, text } = data;
          if (!conversationId || !text) return;
          // Проверим участника
          const conv = await prisma.conversation.findUnique({ where: { id: conversationId } });
          if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId && conv.userId !== userId && conv.adminId !== userId)) {
            return;
          }
          // Сохраняем сообщение через ChatService (нам нужен доступ к сервису)
          const chatService = fastify.chatService as any;
          const msg = await chatService.sendMessage(conversationId, userId, text);
          // Рассылаем всем в комнате, включая отправителя
          const rooms = fastify.wsRooms as Map<number, Set<any>>;
          const sockets = rooms.get(conversationId);
          if (sockets) {
            const payload = JSON.stringify({ type: 'new_message', message: msg });
            for (const sock of sockets) {
              if (sock.readyState === 1) { // OPEN
                sock.send(payload);
              }
            }
          }
        }
      } catch (err) {
        // логируем ошибку
      }
    });

    connection.on('close', () => {
      // Удаляем сокет из всех комнат, где он был
      const rooms = fastify.wsRooms as Map<number, Set<any>>;
      for (const [convId, sockets] of rooms.entries()) {
        sockets.delete(connection);
        if (sockets.size === 0) rooms.delete(convId);
      }
    });
  });
}