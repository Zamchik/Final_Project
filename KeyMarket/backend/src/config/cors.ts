// Конфигурация CORS

/**
 * Настройки CORS для разработки.
 * Разрешает запросы с фронтенда (http://localhost:5173) и передачу кук.
 */
export const corsOptions = {
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};