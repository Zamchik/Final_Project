// Конфигурация CORS
export const corsOptions = {
  // Берём список разрешённых origin из переменной окружения.
  // Если переменная не задана, разрешаем localhost (для разработки).
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1'],
  credentials: true,
};