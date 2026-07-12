// Общий HTTP-клиент для всех запросов к бэкенду.
// Использует axios с базовым URL, определённым в переменной окружения VITE_API_URL.
// В development VITE_API_URL не задана, запросы проксируются через vite.config.ts.
// В production (Render) используется абсолютный URL бэкенда.
import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/',
  withCredentials: true, // для передачи сессионных кук
});

export default apiClient;