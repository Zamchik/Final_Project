import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';

const app = Fastify({ logger: true });

app.register(cors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});
app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecretkey' });
app.register(categoryRoutes, { prefix: '/categories' });

app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const payload = await request.jwtVerify<{ id: number; email: string; role: string }>();
    request.user = payload;
  } catch {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

app.register(authRoutes, { prefix: '/auth' });
app.register(productRoutes, { prefix: '/products' });

app.get('/health', async () => ({ status: 'ok' }));

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