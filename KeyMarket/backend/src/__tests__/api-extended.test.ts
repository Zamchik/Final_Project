// Интеграционные тесты расширенного API.
import Fastify from 'fastify';
import cors from '@fastify/cors';
import secureSession from '@fastify/secure-session';
import crypto from 'crypto';
import authRoutes from '../routes/auth.routes';
import productRoutes from '../routes/product.routes';
import publicRoutes from '../routes/public.routes';
import orderRoutes from '../routes/order.routes';
import paymentRoutes from '../routes/payment.routes';
import adminRoutes from '../routes/admin.routes';
import reviewRoutes from '../routes/review.routes';
import uploadRoutes from '../routes/upload.routes';
import { prisma } from '../prisma';

// Хелперы
const hashPassword = (password: string): string => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

const ensureTestUsers = async () => {
  const users = [
    { email: 'admin@keymarket.local', password: 'admin123', role: 'SUPER_ADMIN' as const },
    { email: 'seller@keymarket.local', password: 'seller123', role: 'SELLER' as const },
    { email: 'buyer@keymarket.local', password: 'buyer123', role: 'BUYER' as const },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash: hashPassword(u.password), role: u.role, verifiedAt: new Date(), bannedAt: null },
      create: {
        email: u.email,
        passwordHash: hashPassword(u.password),
        role: u.role,
        verifiedAt: new Date(),
      },
    });
  }
};

const buildApp = () => {
  const app = Fastify();

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

  app.decorate('authenticate', async (request: any, reply: any) => {
    if (!request.session.get('user')) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  app.register(authRoutes, { prefix: '/auth' });
  app.register(productRoutes, { prefix: '/products' });
  app.register(publicRoutes, { prefix: '/products' });
  app.register(orderRoutes, { prefix: '/orders' });
  app.register(paymentRoutes, { prefix: '/payments' });
  app.register(adminRoutes, { prefix: '/admin' });
  app.register(reviewRoutes, { prefix: '/reviews' });
  app.register(uploadRoutes, { prefix: '/upload' });

  return app;
};

describe('Extended API Integration Tests', () => {
  let app: ReturnType<typeof buildApp>;

  beforeAll(async () => {
    await ensureTestUsers();
    app = buildApp();
  });

  afterAll(async () => {
    // Корректная очистка: сначала зависимые записи
    await prisma.review.deleteMany({ where: { comment: 'Great!' } });

    const buyerOrders = await prisma.order.findMany({ where: { buyerId: { in: [await getUserIdByEmail('buyer@keymarket.local')] } }, select: { id: true } });
    for (const o of buyerOrders) {
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
    }
    await prisma.order.deleteMany({ where: { id: { in: buyerOrders.map(o => o.id) } } });

    const testProducts = await prisma.product.findMany({ where: { title: 'E2E Test Product' }, select: { id: true } });
    for (const p of testProducts) {
      await prisma.productKey.deleteMany({ where: { productId: p.id } });
    }
    await prisma.product.deleteMany({ where: { title: 'E2E Test Product' } });

    await prisma.$disconnect();
  });

  const getUserIdByEmail = async (email: string): Promise<number> => {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (!user) throw new Error(`User ${email} not found`);
    return user.id;
  };

  const loginAs = async (email: string, password: string): Promise<string> => {
    const resp = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email, password },
    });
    expect(resp.statusCode).toBe(200);
    const raw = resp.headers['set-cookie'];
    return Array.isArray(raw) ? raw[0] : (raw as string);
  };

  const uniqueKey = (prefix = 'TEST') => `${prefix}-${crypto.randomUUID()}`;

  // Продавец создаёт товар
  it('SELLER может создать товар', async () => {
    const sellerCookie = await loginAs('seller@keymarket.local', 'seller123');
    const response = await app.inject({
      method: 'POST',
      url: '/products',
      headers: { cookie: sellerCookie },
      payload: {
        title: 'E2E Test Product',
        price: 500,
        categoryId: 1,
        keys: [uniqueKey('K1')],
      },
    });
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.title).toBe('E2E Test Product');
    expect(body.stock).toBe(1);
  });

  // Публичный каталог
  it('GET /products возвращает список товаров', async () => {
    const response = await app.inject({ method: 'GET', url: '/products' });
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toHaveProperty('products');
    expect(body).toHaveProperty('total');
    expect(body.products.length).toBeGreaterThan(0);
  });

  // Полный цикл покупки
  it('полный цикл: создать заказ -> оплатить -> получить ключ', async () => {
    const sellerCookie = await loginAs('seller@keymarket.local', 'seller123');
    const createResp = await app.inject({
      method: 'POST',
      url: '/products',
      headers: { cookie: sellerCookie },
      payload: {
        title: 'E2E Test Product',
        price: 500,
        categoryId: 1,
        keys: [uniqueKey('K2')],
      },
    });
    expect(createResp.statusCode).toBe(201);
    const product = JSON.parse(createResp.body);

    const buyerCookie = await loginAs('buyer@keymarket.local', 'buyer123');

    // Создаём заказ
    const orderResp = await app.inject({
      method: 'POST',
      url: '/orders',
      headers: { cookie: buyerCookie },
      payload: { productId: product.id },
    });
    expect(orderResp.statusCode).toBe(201);
    const order = JSON.parse(orderResp.body);

    // Платёж
    const paymentResp = await app.inject({
      method: 'POST',
      url: `/payments/orders/${order.id}/create-payment`,
      headers: { cookie: buyerCookie },
    });
    expect(paymentResp.statusCode).toBe(200);
    const payment = JSON.parse(paymentResp.body);

    // Вебхук
    const webhookResp = await app.inject({
      method: 'POST',
      url: '/payments/webhook',
      payload: { externalId: payment.externalId },
    });
    expect(webhookResp.statusCode).toBe(200);

    // Проверяем заказ и ключ
    const checkResp = await app.inject({
      method: 'GET',
      url: `/orders/${order.id}`,
      headers: { cookie: buyerCookie },
    });
    expect(checkResp.statusCode).toBe(200);
    const finalOrder = JSON.parse(checkResp.body);
    expect(finalOrder.status).toBe('DELIVERED');
    expect(finalOrder.items[0].productKey.keyValue).toBeTruthy();
  });

  // Отзыв
  it('покупатель может оставить отзыв после покупки', async () => {
    const buyerCookie = await loginAs('buyer@keymarket.local', 'buyer123');
    const ordersResp = await app.inject({
      method: 'GET',
      url: '/orders/my?status=DELIVERED',
      headers: { cookie: buyerCookie },
    });
    const orders = JSON.parse(ordersResp.body).orders;
    expect(orders.length).toBeGreaterThan(0);
    const target = orders[0];

    const reviewResp = await app.inject({
      method: 'POST',
      url: '/reviews',
      headers: { cookie: buyerCookie },
      payload: {
        productId: target.items[0].product.id,
        orderId: target.id,
        rating: 5,
        comment: 'Great!',
      },
    });
    expect(reviewResp.statusCode).toBe(201);
    expect(JSON.parse(reviewResp.body).rating).toBe(5);
  });

  // Админ-эндпоинты
  it('админ может получить список пользователей', async () => {
    const adminCookie = await loginAs('admin@keymarket.local', 'admin123');
    const resp = await app.inject({
      method: 'GET',
      url: '/admin/users',
      headers: { cookie: adminCookie },
    });
    expect(resp.statusCode).toBe(200);
    expect(JSON.parse(resp.body).users.length).toBeGreaterThan(0);
  });

  it('админ может забанить и разбанить пользователя', async () => {
    const adminCookie = await loginAs('admin@keymarket.local', 'admin123');
    const buyerId = await getUserIdByEmail('buyer@keymarket.local');

    // Бан
    const banResp = await app.inject({
      method: 'PUT',
      url: `/admin/users/${buyerId}/ban`,
      headers: { cookie: adminCookie },
    });
    expect(banResp.statusCode).toBe(200);

    // Забаненный не может войти
    const blocked = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'buyer@keymarket.local', password: 'buyer123' },
    });
    expect(blocked.statusCode).toBe(403);

    // Разбан
    const unbanResp = await app.inject({
      method: 'PUT',
      url: `/admin/users/${buyerId}/unban`,
      headers: { cookie: adminCookie },
    });
    expect(unbanResp.statusCode).toBe(200);

    // Теперь входит
    const again = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { email: 'buyer@keymarket.local', password: 'buyer123' },
    });
    expect(again.statusCode).toBe(200);
  });

  // Обработка ошибок
  it('возвращает 404 для несуществующего товара', async () => {
    const resp = await app.inject({ method: 'GET', url: '/products/99999' });
    expect(resp.statusCode).toBe(404);
  });

  it('возвращает 409 при повторной регистрации', async () => {
    const resp = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: { email: 'buyer@keymarket.local', password: '123456' },
    });
    expect(resp.statusCode).toBe(409);
  });
});