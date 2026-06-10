import 'dotenv/config';
import Fastify, { FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import crypto from 'crypto';

const app = Fastify({ logger: true });

app.register(cors, {
  origin: 'http://localhost:5173', // фронтенд
  credentials: true,               // разрешаем передачу кук
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
});

// Генерация ключей для сессий
const sessionKey = process.env.SESSION_SECRET
  ? Buffer.from(process.env.SESSION_SECRET, 'hex')
  : crypto.randomBytes(32);

app.register(secureSession, {
  key: sessionKey,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60,
  },
});

// Декоратор для проверки авторизации
app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
  if (!request.session.get('user')) {
    reply.status(401).send({ error: 'Unauthorized' });
  }
});

// типы для сессии
declare module '@fastify/secure-session' {
  interface SessionData {
    user: {
      id: number;
      email: string;
      role: string;
    };
  }
}

app.register(authRoutes, { prefix: '/auth' });
app.register(productRoutes, { prefix: '/products' });
app.register(categoryRoutes, { prefix: '/categories' });

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