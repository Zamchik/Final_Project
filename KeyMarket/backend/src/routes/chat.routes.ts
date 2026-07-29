import { FastifyInstance } from 'fastify';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';
import { prisma } from '../prisma';

export default async function chatRoutes(fastify: FastifyInstance) {
  const chatService = new ChatService(prisma, fastify.emailService);
  const controller = new ChatController(chatService);

  fastify.get('/conversations', { preHandler: [fastify.authenticate] }, controller.getConversations);
  fastify.post('/order/:orderId', { preHandler: [fastify.authenticate] }, controller.getOrderChat);
  fastify.post('/support', { preHandler: [fastify.authenticate] }, controller.getSupportChat);
  fastify.get('/:id/messages', { preHandler: [fastify.authenticate] }, controller.getMessages);
  fastify.post('/:id/messages', { preHandler: [fastify.authenticate] }, controller.sendMessage);
  fastify.put('/:id/read', { preHandler: [fastify.authenticate] }, controller.markRead);
  fastify.get('/admin/chat/tickets', { preHandler: [fastify.authenticate] }, controller.getSupportTickets);
}