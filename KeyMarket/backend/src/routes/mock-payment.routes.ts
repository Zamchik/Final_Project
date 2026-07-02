// Маршрут для имитации страницы оплаты (Mock)
import { FastifyInstance } from 'fastify';

export default async function mockPaymentRoutes(fastify: FastifyInstance) {
  // Страница имитации оплаты (простой HTML)
  fastify.get('/:externalId', async (request, reply) => {
    const { externalId } = request.params as { externalId: string };
    reply.type('text/html; charset=utf-8').send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <title>Оплата</title>
      </head>
      <body style="font-family: sans-serif; text-align: center; margin-top: 50px;">
        <h1>Имитация оплаты</h1>
        <p>Платёж ID: <strong>${externalId}</strong></p>
        <button id="pay-btn" style="padding: 10px 20px; font-size: 16px;">Оплатить</button>
        <p id="result"></p>
        <script>
          document.getElementById('pay-btn').addEventListener('click', async () => {
            const res = await fetch('/payments/webhook', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ externalId: '${externalId}' })
            });
            const data = await res.json();
            document.getElementById('result').textContent = data.success
              ? 'Оплата прошла успешно!'
              : 'Ошибка оплаты';
          });
        </script>
      </body>
      </html>
    `);
  });
}