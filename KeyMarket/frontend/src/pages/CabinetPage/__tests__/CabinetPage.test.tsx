import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import CabinetPage from '../CabinetPage';
import { useAuthStore } from '@/entities/user/model/authStore';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url === '/orders/my') {
        return Promise.resolve({ data: { orders: [], total: 0, page: 1, limit: 10 } });
      }
      if (url === '/orders/sales') {
        return Promise.resolve({ data: { orders: [], total: 0, page: 1, limit: 10 } });
      }
      return Promise.resolve({ data: {} });
    }),
    post: vi.fn(),
  },
}));

describe('CabinetPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 3, email: 'buyer@test.com', role: 'BUYER', balance: 1000 },
      loading: false,
      fetched: true,
    });
  });

  it('отображает email и роль пользователя', async () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <CabinetPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    await waitFor(() => {
      expect(screen.getByText('buyer@test.com')).toBeInTheDocument();
    });
    expect(screen.getByText('Покупатель')).toBeInTheDocument();
  });

  it('показывает кнопки для покупателя', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <CabinetPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByText('Сменить пароль')).toBeInTheDocument();
    expect(screen.getByText('Выйти')).toBeInTheDocument();
  });
});