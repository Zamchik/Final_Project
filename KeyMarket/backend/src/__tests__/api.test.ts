// Проверяют регистрацию, вход и доступ к защищённым маршрутам.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import crypto from 'crypto';
import authRoutes from '../routes/auth.routes';
import orderRoutes from '../routes/order.routes';
import { prisma } from '../prisma';

const buildApp = () => {
  const app = Fastify();

  // Моки для emailService и notificationService
  app.decorate('emailService', {
    send: jest.fn().mockResolvedValue({ messageId: 'test' }),
    transporter: {},
    logger: console,
  } as any);

  app.decorate('notificationService', {
    create: jest.fn().mockResolvedValue(undefined),
    getUnread: jest.fn().mockResolvedValue([]),
    markAsRead: jest.fn().mockResolvedValue(undefined),
  } as any);

  app.register(cors, { origin: true, methods: ['GET', 'POST', 'PUT', 'DELETE'] });
  app.register(secureSession, {
    key: crypto.randomBytes(32),
    cookie: { path: '/', httpOnly: true, secure: false, sameSite: 'lax', maxAge: 3600 },
  });

  // Декоратор authenticate (как в app.ts)
  app.decorate('authenticate', async (request: any, reply: any) => {
    if (!request.session.get('user')) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  // Регистрируем маршруты
  app.register(authRoutes, { prefix: '/auth' });
  app.register(orderRoutes, { prefix: '/orders' });

  return app;
};

describe('API Integration Tests', () => {
  const testEmail = 'apitest@example.com';
  const testPassword = 'password123';

  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('POST /auth/register — регистрация', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: testEmail, password: testPassword },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('verificationUrl');
  });

  it('POST /auth/login — вход', async () => {
    const app = buildApp();
    await prisma.user.update({ where: { email: testEmail }, data: { verifiedAt: new Date() } });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: testEmail, password: testPassword },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.email).toBe(testEmail);

    const cookie = response.headers['set-cookie'];
    expect(cookie).toBeDefined();

    const meResponse = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { cookie },
    });
    expect(meResponse.statusCode).toBe(200);
    const meBody = JSON.parse(meResponse.body);
    expect(meBody.email).toBe(testEmail);
  });

  it('POST /orders — создание заказа без авторизации → 401', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/orders',
      payload: { productId: 1 },
    });
    expect(response.statusCode).toBe(401);
  });
});