// Тест карточки товара: название, цена, категория, кнопка "Купить", избранное, продажи.
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import { ProductCard } from '@/entities/product';
import { TestRouter } from '@/test/testUtils';

// Мокаем навигацию
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('ProductCard', () => {
  const product = {
    id: 1,
    title: 'Cyberpunk 2077',
    price: '1999',
    imageUrl: null,
    productType: 'GAME' as const,
    category: { name: 'Экшен' },
    sales: 150,
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, email: 'test@test.com', role: 'buyer' },
      loading: false,
      fetched: true,
    });
    useWishlistStore.setState({ items: [] });
  });

  it('отображает название, цену и категорию товара', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
    expect(screen.getByText('1999 ₽')).toBeInTheDocument();
    expect(screen.getByText('Экшен')).toBeInTheDocument();
  });

  it('отображает кнопку "Купить"', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByRole('button', { name: /купить/i })).toBeInTheDocument();
  });

  it('добавляет товар в избранное при клике на сердечко', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    const heartButton = screen.getByRole('button', { name: /heart/i });
    fireEvent.click(heartButton);
    const wishlistItems = useWishlistStore.getState().items;
    expect(wishlistItems.some(item => item.id === product.id)).toBe(true);
  });

  it('отображает количество продаж (150)', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByText('150 продаж')).toBeInTheDocument();
  });
});