// Интерфейс платёжного шлюза
// Любая реализация (Mock или реальный шлюз) должна следовать этому контракту
export interface PaymentGateway {
    /**
     * Создать платёж (ордер) на стороне шлюза.
     * @param refId - ID платежа в нашей системе
     * @param amount - сумма
     * @param userId - ID пользователя
     * @returns объект с externalId (ID в шлюзе) и paymentUrl (ссылка для оплаты)
     */
    init(refId: number, amount: number, userId: number): Promise<{ externalId: string; paymentUrl: string }>;

    /**
     * Получить статус платежа из шлюза.
     * @param externalId - ID в шлюзе
     * @returns статус платежа
     */
    getState(externalId: string): Promise<{ state: 'paid' | 'in-progress' | 'cancelled' }>;

    /**
     * Отменить платёж в шлюзе.
     * @param externalId - ID в шлюзе
     */
    cancel(externalId: string): Promise<void>;
}