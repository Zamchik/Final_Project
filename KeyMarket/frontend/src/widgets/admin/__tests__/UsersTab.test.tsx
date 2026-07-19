import { render, screen, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import UsersTab from '../UsersTab';
import { useAuthStore } from '@/entities/user/model/authStore';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        users: [
          { id: 1, email: 'admin@test.com', role: 'SUPER_ADMIN', balance: '0', bannedAt: null, createdAt: new Date().toISOString() },
          { id: 2, email: 'seller@test.com', role: 'SELLER', balance: '500', bannedAt: null, createdAt: new Date().toISOString() },
        ],
        total: 2,
        page: 1,
        limit: 20,
      },
    }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('UsersTab', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, email: 'admin@test.com', role: 'SUPER_ADMIN' },
    });
  });

  it('отображает таблицу пользователей', async () => {
    render(
      <ConfigProvider>
        <App>
          <UsersTab />
        </App>
      </ConfigProvider>
    );
    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('seller@test.com')).toBeInTheDocument();
    });
  });
});