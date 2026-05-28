import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth.routes';

const app = Fastify({ logger: true });

app.register(cors, { origin: true });
app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecretkey' });

// Декоратор authenticate
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    await request.jwtVerify();
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// Маршруты
app.register(authRoutes, { prefix: '/auth' });

// Health check
app.get('/health', async () => {
  return { status: 'ok' };
});

const start = async () => {
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();