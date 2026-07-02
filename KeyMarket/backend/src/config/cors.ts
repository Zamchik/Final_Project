// Конфигурация CORS
export const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost', 'http://127.0.0.1'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
};