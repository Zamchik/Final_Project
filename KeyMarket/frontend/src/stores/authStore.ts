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
      if (error.response?.status === 403) {
        message.error('Ваш email не подтверждён. Проверьте почту и перейдите по ссылке.');
        throw error;
      }
      message.error(error.response?.data?.error || 'Ошибка входа');
    }
  },

  // Регистрация
  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    return data;
  },

  // Выход
  logout: async () => {
    await apiClient.post('/auth/logout');
    set({ user: null, fetched: false });
  },

  // Проверка сессии
  fetchUser: async (force = false) => {
    if (get().fetched && !force) return;
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, fetched: true, loading: false });
    } catch {
      set({ user: null, fetched: true, loading: false });
    }
  },
}));