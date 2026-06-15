// Главный файл приложения Fastify

import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import publicRoutes from './routes/public.routes';

import { corsOptions } from './config/cors';
import { sessionKey, sessionCookieOptions } from './config/session';
import { authenticate } from './middleware/authenticate';

const app = Fastify({ logger: true });

// CORS
app.register(cors, corsOptions);

// Сессии
app.register(secureSession, {
  key: sessionKey,
  cookie: sessionCookieOptions,
});

// Декоратор аутентификации
app.decorate('authenticate', authenticate);

// Расширение типов для сессии (можно вынести в types/session.d.ts при желании)
declare module '@fastify/secure-session' {
  interface SessionData {
    user: {
      id: number;
      email: string;
      role: string;
    };
  }
}

// Маршруты
app.register(authRoutes, { prefix: '/auth' });
app.register(categoryRoutes, { prefix: '/categories' });
app.register(productRoutes, { prefix: '/products' });
app.register(publicRoutes, { prefix: '/products' });

// Health check
app.get('/health', async () => ({ status: 'ok' }));

// Запуск сервера
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