// Хранилище Zustand для аутентификации
import { create } from 'zustand';
import apiClient from '../api/client';
import { message } from 'antd';
import { AxiosError } from 'axios';
import { useWishlistStore } from './wishlistStore';

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

      // Загружаем избранное для пользователя
      const stored = localStorage.getItem(`keymarket-wishlist-${data.user.id}`);
      if (stored) {
        try {
          const items = JSON.parse(stored);
          useWishlistStore.getState().setItems(items);
        } catch {
          useWishlistStore.getState().setItems([]);
        }
      } else {
        useWishlistStore.getState().setItems([]);
      }

      message.success('Вход выполнен');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      if (error.response?.status === 403) {
        const msg = error.response?.data?.error || '';
        if (msg.includes('заблокирован') || msg.includes('бан')) {
          message.error('Ваш аккаунт заблокирован');
        } else {
          message.error('Email не подтверждён. Проверьте почту и перейдите по ссылке.');
        }
        throw error;
      }
      message.error(error.response?.data?.error || 'Ошибка входа');
    }
  },

  // Регистрация
  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    message.success(data.message || 'Регистрация успешна. Проверьте почту для подтверждения.');
    return data as { message: string; verificationUrl?: string; previewUrl?: string | null };
  },

  // Выход
  logout: async () => {
    const userId = get().user?.id;
    if (userId) {
      // Сохраняем текущее избранное перед выходом
      const items = useWishlistStore.getState().items;
      localStorage.setItem(`keymarket-wishlist-${userId}`, JSON.stringify(items));
    }

    await apiClient.post('/auth/logout');
    useWishlistStore.getState().setItems([]);
    set({ user: null, fetched: false });
  },

  // Проверка сессии (при обновлении страницы)
  fetchUser: async (force = false) => {
    if (get().fetched && !force) return;
    set({ loading: true });
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, fetched: true, loading: false });

      if (data?.id) {
        const stored = localStorage.getItem(`keymarket-wishlist-${data.id}`);
        if (stored) {
          try {
            const items = JSON.parse(stored);
            useWishlistStore.getState().setItems(items);
          } catch {
            useWishlistStore.getState().setItems([]);
          }
        } else {
          useWishlistStore.getState().setItems([]);
        }
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      if (error.response?.status === 401 || error.response?.status === 403) {
        if (error.response?.status === 403) {
          message.error('Ваш аккаунт заблокирован');
        }
        set({ user: null, fetched: true, loading: false });
      } else {
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