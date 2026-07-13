// app/__tests__/ProductPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductPage from '@/pages/ProductPage/ProductPage';
import { useAuthStore } from '@/entities/user/model/authStore';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockResolvedValue({
      data: {
        id: 1,
        title: 'Test Product',
        description: 'Test Description',
        price: '100',
        rating: '4.5',
        stock: 5,
        productType: 'GAME',
        category: { id: 1, name: 'Games' },
        status: 'active',
      },
    }),
    post: vi.fn(),
  },
}));

describe('ProductPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, email: 'test@test.com', role: 'buyer' },
      loading: false,
      fetched: true,
    });
  });

  it('отображает информацию о товаре после загрузки', async () => {
    render(
      <MemoryRouter initialEntries={['/product/1']}>
        <ConfigProvider>
          <ProductPage />
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    expect(screen.getByText('100 ₽')).toBeInTheDocument();
    expect(screen.getByText('Games')).toBeInTheDocument();
  });

  it('показывает кнопку "Купить" для авторизованного пользователя', async () => {
    render(
      <MemoryRouter initialEntries={['/product/1']}>
        <ConfigProvider>
          <ProductPage />
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /купить/i })).toBeInTheDocument();
  });
});