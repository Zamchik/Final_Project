// Хранилище Zustand для аутентификации
// Управляет состоянием пользователя, загрузкой и сессионными запросами
import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
}

interface AuthState {
  user: User | null;           // данные текущего пользователя (null = гость)
  loading: boolean;            // идёт ли проверка сессии (запрос /auth/me)
  fetched: boolean;             // был ли выполнен fetchUser (чтобы не дёргать лишний раз)
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,   // изначально false – чтобы эффект в Layout мог сразу запустить fetchUser
  fetched: false,    // данные ещё не загружены

  // Логин

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    // После успешного входа сохраняем пользователя и считаем, что данные загружены
    set({ user: data.user, fetched: true });
  },

  // Регистрация

  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    set({ user: data.user, fetched: true });
  },

  // Выход

  logout: async () => {
    await apiClient.post('/auth/logout');
    // Сбрасываем пользователя и флаг загрузки
    set({ user: null, fetched: false });
  },

  // Проверка сессии (запрос /auth/me)

  fetchUser: async () => {
    // Если данные уже загружены – не делаем повторный запрос
    if (get().fetched) return;
    // Показываем, что идёт загрузка
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/auth/me');
      // Сохраняем пользователя и отмечаем, что загрузка завершена
      set({ user: data, fetched: true, loading: false });
    } catch {
      // Если запрос неудачен (например, нет сессии) – сбрасываем пользователя,
      // но всё равно завершаем загрузку
      set({ user: null, fetched: true, loading: false });
    }
  },
}));