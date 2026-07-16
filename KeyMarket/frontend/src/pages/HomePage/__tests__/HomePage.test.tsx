import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import apiClient from '@/shared/api/client';
import HomePage from '@/pages/HomePage/HomePage';

// Мокаем API-клиент
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
    // Сбрасывать Zustand-сторы не требуется, но можно добавить при необходимости
  });

  // 1. Заголовок Hero-секции
  it('отображает заголовок Hero-секции', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(await screen.findByText(/Покупайте цифровые товары/)).toBeInTheDocument();
  });

  // 2. Популярные товары после загрузки – ИСПРАВЛЕНО
  it('отображает популярные товары после загрузки', async () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );

    // Ждём появления хотя бы одного элемента с текстом Test Game
    const gameElements = await screen.findAllByText('Test Game');
    // Проверяем, что нашёлся хотя бы один элемент
    expect(gameElements.length).toBeGreaterThan(0);
  });

  // 3. Кнопка перехода в каталог
  it('содержит кнопку перехода в каталог', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <HomePage />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: /Перейти в каталог/ })).toBeInTheDocument();
  });
});