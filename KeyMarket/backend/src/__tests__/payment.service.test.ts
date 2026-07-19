// Тестирование PaymentService.
import { PaymentService } from '../services/payment/payment.service';
import { MockPaymentGateway } from '../services/payment/mock-payment-gateway';
import { OrderService } from '../services/order.service';
import { prisma } from '../prisma';
import crypto from 'crypto';

describe('PaymentService', () => {
  let paymentService: PaymentService;
  let mockGateway: MockPaymentGateway;
  let orderService: OrderService;
  const emailService = { send: jest.fn().mockResolvedValue({}) } as any;
  const notificationService = {
    create: jest.fn(() => Promise.resolve()),
  } as any;
  const logger = { error: jest.fn(), info: jest.fn() } as any;

  const buyerId = 3; // buyer@keymarket.local 
  let orderId: number;
  let paymentId: number;
  let productId: number;

  beforeAll(async () => {
    // Создаём тестовый товар с уникальным ключом
    const uniqueKey = `PAY-TEST-${crypto.randomUUID()}`;
    const seller = await prisma.user.upsert({
      where: { email: 'seller@keymarket.local' },
      update: {},
      create: {
        email: 'seller@keymarket.local',
        passwordHash: 'any',
        role: 'SELLER',
        verifiedAt: new Date(),
      },
    });

    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        categoryId: 1,
        title: 'Payment Test Product',
        price: 100,
        stock: 1,
        keys: {
          create: { keyValue: uniqueKey },
        },
      },
      include: { keys: true },
    });
    productId = product.id;
    const keyId = product.keys[0].id;

    // Создаём заказ CREATED
    const order = await prisma.order.create({
      data: {
        buyerId,
        totalPrice: 100,
        status: 'CREATED',
        items: {
          create: {
            productId,
            productKeyId: keyId,
            price: 100,
          },
        },
      },
    });
    orderId = order.id;

    orderService = new OrderService(prisma);
    mockGateway = new MockPaymentGateway();
    paymentService = new PaymentService(prisma, mockGateway, orderService, emailService, notificationService, logger);
  });

  afterAll(async () => {
    // Удаляем созданные записи
    await prisma.orderItem.deleteMany({ where: { orderId } });
    await prisma.order.delete({ where: { id: orderId } });
    if (paymentId) {
      await prisma.payment.delete({ where: { id: paymentId } }).catch(() => {});
    }
    // Удаляем товар и ключи
    await prisma.productKey.deleteMany({ where: { productId } });
    await prisma.product.delete({ where: { id: productId } });
  });

  it('должен создать платёж для существующего заказа', async () => {
    const result = await paymentService.createOrderPayment(orderId, buyerId);
    expect(result).toHaveProperty('paymentId');
    expect(result).toHaveProperty('externalId');
    paymentId = result.paymentId;
  });

  it('должен выбросить ошибку для несуществующего заказа', async () => {
    await expect(paymentService.createOrderPayment(99999, buyerId)).rejects.toThrow('Заказ не найден или не принадлежит вам');
  });

  it('должен обработать успешный платёж и доставить заказ', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    if (!payment) throw new Error('Платёж не найден');
    await mockGateway.confirm(payment.externalId);

    const result = await paymentService.handlePaymentSuccess(payment.externalId);
    expect(result.success).toBe(true);

    const updatedOrder = await prisma.order.findUnique({ where: { id: orderId } });
    expect(updatedOrder!.status).toBe('DELIVERED');
    expect(notificationService.create).toHaveBeenCalled();
    expect(emailService.send).toHaveBeenCalled();
  });

  it('должен выбросить ошибку при повторной обработке', async () => {
    const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
    await expect(paymentService.handlePaymentSuccess(payment!.externalId)).rejects.toThrow('Платёж не найден или уже обработан');
  });
});