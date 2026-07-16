import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductPage from '@/pages/ProductPage/ProductPage';
import { useAuthStore } from '@/entities/user/model/authStore';

// Мокаем useParams, чтобы всегда возвращал id = '1'
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: '1' }),
  };
});

// Мокаем apiClient
vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.includes('/rating')) {
        return Promise.resolve({ data: { average: 4.5, count: 10 } });
      }
      return Promise.resolve({
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
          salesCount: 10,
        },
      });
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
          <App>
            <ProductPage />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    expect(screen.getByText('100 ₽')).toBeInTheDocument();
    expect(screen.getByText(/10 продаж/)).toBeInTheDocument();
  });

  it('показывает кнопку "Купить" для авторизованного пользователя', async () => {
    render(
      <MemoryRouter initialEntries={['/product/1']}>
        <ConfigProvider>
          <App>
            <ProductPage />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /купить/i })).toBeInTheDocument();
  });
});