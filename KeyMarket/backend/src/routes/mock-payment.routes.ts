// Маршрут для имитации страницы оплаты (Mock)
import { FastifyInstance } from 'fastify';

export default async function mockPaymentRoutes(fastify: FastifyInstance) {
  fastify.get('/:externalId', async (request, reply) => {
    const { externalId } = request.params as { externalId: string };
    reply.type('text/html; charset=utf-8').send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Оплата заказа — KeyMarket</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            color: #fff;
          }
          .payment-card {
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(12px);
            border-radius: 24px;
            padding: 40px 30px;
            max-width: 420px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            border: 1px solid rgba(255,255,255,0.1);
          }
          .logo {
            font-size: 28px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #fff;
            margin-bottom: 20px;
          }
          .logo span { color: #722ed1; }
          .title {
            font-size: 22px;
            margin-bottom: 8px;
          }
          .subtitle {
            color: #b0b0b0;
            margin-bottom: 24px;
          }
          .payment-id {
            background: rgba(114,46,209,0.2);
            color: #c4b5fd;
            padding: 10px 16px;
            border-radius: 12px;
            font-family: monospace;
            margin-bottom: 30px;
            word-break: break-all;
          }
          .btn-pay {
            background: #722ed1;
            border: none;
            padding: 14px 36px;
            border-radius: 14px;
            font-size: 18px;
            color: #fff;
            font-weight: 600;
            cursor: pointer;
            transition: 0.3s;
            width: 100%;
            letter-spacing: 0.5px;
          }
          .btn-pay:hover {
            background: #531dab;
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(114,46,209,0.5);
          }
          .btn-pay:active {
            transform: translateY(0);
          }
          .result {
            margin-top: 20px;
            font-weight: 500;
            font-size: 16px;
            color: #52c41a;
          }
          .footer {
            margin-top: 30px;
            color: #666;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="payment-card">
          <div class="logo">
            <span>K</span>eyMarket
          </div>
          <div class="title">Подтверждение оплаты</div>
          <div class="subtitle">Вы собираетесь оплатить заказ через защищённый платёжный шлюз</div>
          <div class="payment-id">
            Номер платежа: <strong>${externalId}</strong>
          </div>
          <button id="pay-btn" class="btn-pay">💳 Оплатить</button>
          <div id="result" class="result"></div>
          <div class="footer">KeyMarket © 2026 · Безопасная сделка</div>
        </div>
        <script>
          document.getElementById('pay-btn').addEventListener('click', async () => {
            const btn = document.getElementById('pay-btn');
            btn.textContent = '⏳ Обрабатывается...';
            btn.disabled = true;

            try {
              const res = await fetch('/payments/webhook', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalId: '${externalId}' })
              });
              const resultEl = document.getElementById('result');
              if (res.ok) {
                resultEl.textContent = '✅ Оплата прошла успешно!';
                resultEl.style.color = '#52c41a';
              } else {
                resultEl.textContent = '❌ Ошибка при обработке платежа';
                resultEl.style.color = '#ff4d4f';
              }
            } catch {
              document.getElementById('result').textContent = '❌ Сетевая ошибка';
            } finally {
              btn.textContent = '💳 Оплатить';
              btn.disabled = false;
            }
          });
        </script>
      </body>
      </html>
    `);
  });
}