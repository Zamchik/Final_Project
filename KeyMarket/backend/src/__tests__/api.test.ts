import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import crypto from 'crypto';
import authRoutes from '../routes/auth.routes';
import orderRoutes from '../routes/order.routes';
import { prisma } from '../prisma';

// Создаём тестовый экземпляр Fastify
const buildApp = () => {
  const app = Fastify();

  // Регистрируем плагины, как в основном приложении
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
    // Очищаем тестового пользователя перед тестами
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
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user).toHaveProperty('id');
    expect(body.user.email).toBe(testEmail);

    // Проверяем, что кука установлена
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('POST /auth/login — вход', async () => {
    const app = buildApp();
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: testEmail, password: testPassword },
    });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.user.email).toBe(testEmail);

    // Получаем куку для следующего запроса
    const cookie = response.headers['set-cookie'];
    expect(cookie).toBeDefined();

    // Проверяем GET /auth/me с этой кукой
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