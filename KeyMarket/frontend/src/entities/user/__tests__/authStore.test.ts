import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../model/authStore';

// Мокаем localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/entities/product/model/wishlistStore', () => ({
  useWishlistStore: {
    getState: () => ({
      setItems: vi.fn(),
      items: [],
    }),
  },
}));

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, fetched: false });
    vi.clearAllMocks();
  });

  it('login устанавливает пользователя при успехе', async () => {
    const { default: apiClient } = await import('@/shared/api/client');
    (apiClient.post as any).mockResolvedValue({
      data: { user: { id: 1, email: 'test@test.com', role: 'BUYER' } },
    });
    await useAuthStore.getState().login('test@test.com', 'password');
    const state = useAuthStore.getState();
    expect(state.user).toEqual({ id: 1, email: 'test@test.com', role: 'BUYER' });
  });

  it('logout очищает пользователя', async () => {
    const { default: apiClient } = await import('@/shared/api/client');
    (apiClient.post as any).mockResolvedValue({});
    useAuthStore.setState({ user: { id: 1, email: 'test@test.com', role: 'BUYER' }, fetched: true });
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
  });
});