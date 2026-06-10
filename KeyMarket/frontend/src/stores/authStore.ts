import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    set({ user: data.user });
  },

  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    set({ user: data.user });
  },

  logout: async () => {
    await apiClient.post('/auth/logout');
    set({ user: null });
  },

  fetchUser: async () => {
    try {
      const { data } = await apiClient.get('/auth/me');
      set({ user: data, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));