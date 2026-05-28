import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(prisma);
  const controller = new AuthController(authService);

  fastify.post('/register', controller.register);
  fastify.post('/login', controller.login);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, controller.me);
}