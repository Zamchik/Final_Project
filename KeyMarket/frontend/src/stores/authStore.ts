import { create } from 'zustand';
import apiClient from '../api/client';

interface User {
  id: number;
  email: string;
  role: string;
  balance?: number;
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('token'),
  user: null,

  login: async (email, password) => {
    const { data } = await apiClient.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  register: async (email, password) => {
    const { data } = await apiClient.post('/auth/register', { email, password });
    localStorage.setItem('token', data.token);
    set({ token: data.token, user: data.user });
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  fetchUser: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const { data } = await apiClient.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    set({ user: data });
  },
}));