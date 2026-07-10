// Mock-реализация платёжного шлюза
// Имитирует поведение реального шлюза: создаёт платёж, хранит статус в памяти,
// генерирует ссылку на имитацию оплаты
import { randomUUID } from 'crypto';
import { PaymentGateway } from './payment-gateway.interface';
import { NotFoundError } from '../../common/errors';

// Хранилище платежей в памяти (в реальном шлюзе это была бы его внутренняя БД)
const mockStore = new Map<string, { refId: number; amount: number; userId: number; state: 'paid' | 'in-progress' | 'cancelled' }>();

export class MockPaymentGateway implements PaymentGateway {
    async init(refId: number, amount: number, userId: number) {
        const externalId = randomUUID();
        mockStore.set(externalId, { refId, amount, userId, state: 'in-progress' });

        // Ссылка на страницу имитации оплаты (будет обрабатываться нашим же бэкендом)
        const baseUrl = process.env.APP_BASE_URL || 'http://localhost:3000';
        const paymentUrl = `${baseUrl}/mock-payment/${externalId}`;

        return { externalId, paymentUrl };
    }

    async getState(externalId: string) {
        const payment = mockStore.get(externalId);
        if (!payment) throw new NotFoundError('Платёж не найден');
        return { state: payment.state };
    }

    async cancel(externalId: string) {
        const payment = mockStore.get(externalId);
        if (!payment) throw new NotFoundError('Платёж не найден');
        payment.state = 'cancelled';
    }

    // Подтвердить платёж (вызывается со страницы имитации оплаты).
    // Этот метод не входит в интерфейс, это служебный метод Mock-шлюза.  
    async confirm(externalId: string) {
        const payment = mockStore.get(externalId);
        if (!payment) throw new NotFoundError('Платёж не найден');
        payment.state = 'paid';
        return payment; // возвращаем данные для webhook'а
    }
}