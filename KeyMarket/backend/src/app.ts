// Главный файл приложения Fastify
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';

import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import publicRoutes from './routes/public.routes';
import walletRoutes from './routes/wallet.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';
import paymentRoutes from './routes/payment.routes';
import mockPaymentRoutes from './routes/mock-payment.routes';
import notificationRoutes from './routes/notification.routes';

import { corsOptions } from './config/cors';
import { sessionKey, sessionCookieOptions } from './config/session';
import { authenticate } from './middleware/authenticate';
import { createTestTransport } from './config/mail';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';

const app = Fastify({ logger: true });

// Расширение типов для сессии (можно вынести в types/session.d.ts)
declare module '@fastify/secure-session' {
  interface SessionData {
    user: {
      id: number;
      email: string;
      role: string;
    };
  }
}

// Асинхронная функция инициализации всего приложения
async function setup() {
  // Email
  const mailTransport = await createTestTransport();
  const emailService = new EmailService(mailTransport);
  const notificationService = new NotificationService();
  app.decorate('emailService', emailService);
  app.decorate('notificationService', notificationService);

  // Плагины
  app.register(cors, corsOptions);
  app.register(secureSession, {
    key: sessionKey,
    cookie: sessionCookieOptions,
  });

  // Декоратор authenticate
  app.decorate('authenticate', authenticate);

  // Маршруты
  app.register(authRoutes, { prefix: '/auth' });
  app.register(categoryRoutes, { prefix: '/categories' });
  app.register(productRoutes, { prefix: '/products' });
  app.register(publicRoutes, { prefix: '/products' });
  app.register(walletRoutes, { prefix: '/wallet' });
  app.register(orderRoutes, { prefix: '/orders' });
  app.register(adminRoutes, { prefix: '/admin' });
  app.register(paymentRoutes, { prefix: '/payments' });
  app.register(mockPaymentRoutes, { prefix: '/mock-payment' });
  app.register(notificationRoutes, { prefix: '/notifications' });

  // Health check
  app.get('/health', async () => ({ status: 'ok' }));

  // Запуск сервера
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server running on http://localhost:3000');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

// Расширение типов Fastify
declare module 'fastify' {
  interface FastifyInstance {
    emailService: import('./services/email.service').EmailService;
    notificationService: import('./services/notification.service').NotificationService;
  }
}

setup();