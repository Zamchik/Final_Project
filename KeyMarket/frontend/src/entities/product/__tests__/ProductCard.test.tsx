// Тесты проверяют отображение цены, названия, кнопки "Купить" и взаимодействие с избранным.
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import { ProductCard } from '@/entities/product';

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

  // Проверяем базовое отображение информации
  it('отображает название, цену и категорию товара', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('Cyberpunk 2077')).toBeInTheDocument();
    expect(screen.getByText('1999 ₽')).toBeInTheDocument();
    expect(screen.getByText('Экшен')).toBeInTheDocument();
  });

  // Проверяем кнопку "Купить"
  it('отображает кнопку "Купить"', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button', { name: /купить/i })).toBeInTheDocument();
  });

  // Проверяем добавление в избранное (клик по сердечку)
  it('добавляет товар в избранное при клике на сердечко', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    const heartButton = screen.getByRole('button', { name: /heart/i });
    fireEvent.click(heartButton);
    // После клика товар должен оказаться в избранном
    const wishlistItems = useWishlistStore.getState().items;
    expect(wishlistItems.some(item => item.id === product.id)).toBe(true);
  });

  // Проверяем количество продаж (форматирование)
  it('отображает количество продаж (150)', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <ProductCard product={product} />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(screen.getByText('150 продаж')).toBeInTheDocument();
  });
});