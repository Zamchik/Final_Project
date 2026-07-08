// Хранилище Zustand для аутентификации
// Управляет состоянием пользователя, загрузкой и сессионными запросами
import { create } from 'zustand';
import apiClient from '../api/client';
import { message } from 'antd';
import { AxiosError } from 'axios';

interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  fetched: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<{ message: string; verificationUrl?: string; previewUrl?: string | null }>;
  logout: () => Promise<void>;
  fetchUser: (force?: boolean) => Promise<void>;
  requestSellerRole: (password: string) => Promise<{ verificationUrl: string; previewUrl: string | null }>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  loading: false,
  fetched: false,

  // Логин
  login: async (email, password) => {
    try {
      const { data } = await apiClient.post('/auth/login', { email, password });
      set({ user: data.user, fetched: true });
      message.success('Вход выполнен');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      // 403 может быть из-за неподтверждённого email или бана
      if (error.response?.status === 403) {
        const msg = error.response?.data?.error || '';
        if (msg.includes('заблокирован') || msg.includes('бан')) {
          message.error('Ваш аккаунт заблокирован');
        } else {
          message.error('Email не подтверждён. Проверьте почту и перейдите по ссылке.');
        }
        // Пробрасываем ошибку, чтобы LoginPage мог показать кнопку повторной отправки
        throw error;
      }
      message.error(error.response?.data?.error || 'Ошибка входа');
    }
  },

  // Регистрация (без изменений, только возвращаемый тип)
  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    // Не устанавливаем пользователя – нужно подтверждение email
    message.success(data.message || 'Регистрация успешна. Проверьте почту для подтверждения.');
    return data as { message: string; verificationUrl?: string; previewUrl?: string | null };
  },

  // Выход
  logout: async () => {
    await apiClient.post('/auth/logout');
    set({ user: null, fetched: false });
  },

  // Проверка сессии (запрос /auth/me)
  fetchUser: async (force = false) => {
    // Если данные уже загружены – не делаем повторный запрос, если не принудительно
    if (get().fetched && !force) return;
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, fetched: true, loading: false });
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      // Если сессия невалидна (401) или пользователь забанен (403) – сбрасываем пользователя
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (error.response?.status === 403) {
          message.error('Ваш аккаунт заблокирован');
        }
        set({ user: null, fetched: true, loading: false });
        // Дополнительно можно вызвать logout для очистки кук, но сессия уже недействительна
      } else {
        // Другие ошибки – просто завершаем загрузку, не сбрасывая пользователя
        set({ loading: false });
      }
    }
  },

  // Запрос роли продавца
  requestSellerRole: async (password: string) => {
    const { data } = await apiClient.post('/auth/request-seller-role', { password });
    message.success('Письмо с подтверждением отправлено на ваш email.');
    return data as { verificationUrl: string; previewUrl: string | null };
  },
}));