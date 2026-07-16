// Тест главной страницы: заголовок, популярные товары, кнопка каталога.
import { render, screen } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HomePage from '@/pages/HomePage/HomePage';
import { TestRouter } from '@/test/testUtils';

// Мокаем apiClient
vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn().mockImplementation((url: string) => {
      if (url.startsWith('/products')) {
        return Promise.resolve({
          data: {
            products: [
              {
                id: 1,
                title: 'Test Game',
                price: '999',
                imageUrl: null,
                productType: 'GAME',
                category: { name: 'Экшен' },
                sales: 100,
              },
            ],
            total: 1,
            page: 1,
            limit: 8,
          },
        });
      }
      return Promise.resolve({ data: [] });
    }),
  },
}));

describe('HomePage', () => {
  beforeEach(() => {
    // Сброс Zustand-сторов не требуется, но можно добавить при необходимости
  });

  it('отображает заголовок Hero-секции', async () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(await screen.findByText(/Покупайте цифровые товары/)).toBeInTheDocument();
  });

  it('отображает популярные товары после загрузки', async () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    // Так как товар выводится и в «Популярных», и в «Новинках»,
    // используем findAllByText и убеждаемся, что хотя бы один элемент есть.
    const gameElements = await screen.findAllByText('Test Game');
    expect(gameElements.length).toBeGreaterThan(0);
  });

  it('содержит кнопку перехода в каталог', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByRole('link', { name: /Перейти в каталог/ })).toBeInTheDocument();
  });
});