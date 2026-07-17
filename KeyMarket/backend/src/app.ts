// Главный файл приложения Fastify
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';

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
import reviewRoutes from './routes/review.routes';
import uploadRoutes from './routes/upload.routes';

import { corsOptions } from './config/cors';
import { sessionKey, sessionCookieOptions } from './config/session';
import { authenticate } from './middleware/authenticate';
import { createTestTransport } from './config/mail';
import { EmailService } from './services/email.service';
import { NotificationService } from './services/notification.service';

import { AppError } from './common/errors';

const app = Fastify({ logger: true, trustProxy: true });

declare module '@fastify/secure-session' {
  interface SessionData {
    user?: {
      id: number;
      email: string;
      role: string;
    };
  }
}

declare module 'fastify' {
  interface FastifyInstance {
    emailService: import('./services/email.service').EmailService;
    notificationService: import('./services/notification.service').NotificationService;
  }
}

async function setup() {
  // Email и уведомления
  const mailTransport = await createTestTransport();
  const emailService = new EmailService(mailTransport, app.log);
  const notificationService = new NotificationService();
  app.decorate('emailService', emailService);
  app.decorate('notificationService', notificationService);

  // Swagger
  app.register(swagger, {
    openapi: {
      info: {
        title: 'KeyMarket API',
        description:
          'API для маркетплейса цифровых товаров KeyMarket.\n\n' +
          '## Основные возможности\n' +
          '- Регистрация и аутентификация (подтверждение email)\n' +
          '- Каталог товаров с фильтрацией, поиском и пагинацией\n' +
          '- Мгновенная покупка и выдача ключа\n' +
          '- Личный кабинет покупателя и продавца\n' +
          '- Вывод средств (эмуляция)\n' +
          '- Администрирование пользователей, товаров и заказов\n\n' +
          '### Аутентификация\n' +
          'Используются сессионные куки (`httpOnly`, `secure`, `sameSite=none`).\n' +
          'После входа кука `session` отправляется автоматически.',
        version: '1.0.0',
        contact: {
          name: 'KeyMarket Support',
          email: 'support@keymarket.local',
        },
      },
      externalDocs: {
        description: 'Полная документация проекта (README)',
        url: 'https://github.com/Zamchik/Final_Project#readme',
      },
      servers: [
        { url: 'http://localhost:3000', description: 'Локальный сервер' },
        { url: 'https://keymarket-api.onrender.com', description: 'Продакшен (Render)' },
      ],
      tags: [
        { name: 'auth', description: 'Аутентификация и управление профилем' },
        { name: 'products', description: 'Каталог товаров и управление товарами продавца' },
        { name: 'categories', description: 'Категории товаров' },
        { name: 'orders', description: 'Заказы: создание, оплата, история' },
        { name: 'wallet', description: 'Баланс и вывод средств' },
        { name: 'payments', description: 'Платёжные операции (mock)' },
        { name: 'admin', description: 'Администрирование (только ADMIN/SUPER_ADMIN)' },
        { name: 'notifications', description: 'Внутренние уведомления' },
        { name: 'reviews', description: 'Отзывы о товарах' },
        { name: 'upload', description: 'Загрузка изображений товаров' },
      ],
      components: {
        securitySchemes: {
          cookieAuth: {
            type: 'apiKey',
            in: 'cookie',
            name: 'session',
            description:
              'Сессионная кука, устанавливается после успешного входа. ' +
              'Для авторизации в Swagger UI сначала выполните POST /auth/login.',
          },
        },
      },
    },
  });

  app.register(swaggerUi, { routePrefix: '/docs' });

  // Плагины
  app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });
  app.register(cors, corsOptions);

  const uploadDir = path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    app.log.info(`Created upload directory: ${uploadDir}`);
  }

  app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
  });

  app.register(secureSession, {
    key: sessionKey,
    cookie: sessionCookieOptions,
  });

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
  app.register(reviewRoutes, { prefix: '/reviews' });
  app.register(uploadRoutes, { prefix: '/upload' });

  app.get('/health', async () => ({ status: 'ok' }));

  app.setErrorHandler(async (error: Error, request, reply) => {
    app.log.error(error);

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        error: error.message,
      });
    }

    const fastifyError = error as any;
    if (fastifyError.validation) {
      return reply.status(400).send({
        error: 'Validation error',
        details: fastifyError.validation,
      });
    }

    return reply.status(500).send({
      error: 'Internal server error',
    });
  });

  try {
    const port = process.env.PORT ? Number(process.env.PORT) : 3000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info('Server running on http://localhost:3000');
    app.log.info('Swagger docs: http://localhost:3000/docs');
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

setup();