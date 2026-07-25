import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import CatalogPage from '../CatalogPage';
import apiClient from '@/shared/api/client';

vi.mock('@/shared/api/client', () => ({
  default: {
    get: vi.fn(),
  },
}));

const mockApi = apiClient as any;

const mockCategories = [{ id: 1, name: 'Экшен' }, { id: 2, name: 'RPG' }];
const mockProducts = [
  {
    id: 1,
    title: 'Test Game',
    price: '999',
    imageUrl: null,
    productType: 'GAME',
    category: { name: 'Экшен' },
    sales: 100,
  },
  {
    id: 2,
    title: 'Another Game',
    price: '1499',
    imageUrl: null,
    productType: 'DLC',
    category: { name: 'RPG' },
    sales: 200,
  },
];

describe('CatalogPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockApi.get.mockImplementation((url: string, config?: any) => {
      if (url === '/categories') {
        return Promise.resolve({ data: mockCategories });
      }
      const params = config?.params;
      if (params?.page === 2) {
        return Promise.resolve({
          data: { products: [mockProducts[1]], total: 2, page: 2, limit: 12 },
        });
      }
      if (params?.search === 'test') {
        return Promise.resolve({
          data: { products: [mockProducts[0]], total: 1, page: 1, limit: 12 },
        });
      }
      // Обычный ответ
      return Promise.resolve({
        data: { products: mockProducts, total: 2, page: 1, limit: 12 },
      });
    });
  });

  it('загружает и отображает товары', async () => {
    render(
      <TestRouter initialEntries={['/catalog']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(await screen.findByText('Test Game')).toBeInTheDocument();
    expect(screen.getByText('999 ₽')).toBeInTheDocument();
  });

  it.skip('фильтр по категории отправляет запрос с categoryId', async () => {
    render(
      <TestRouter initialEntries={['/catalog']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    await screen.findByText('Test Game');

    const select = screen.getByRole('combobox');
    await userEvent.click(select);
    const option = await screen.findByRole('option', { name: 'RPG' });
    await userEvent.click(option);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 1,
          limit: 12,
          categoryId: 2,
        }),
      });
    });
  });

  it('фильтр по цене отправляет запрос с minPrice и maxPrice', async () => {
    render(
      <TestRouter initialEntries={['/catalog']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    const minInput = screen.getByPlaceholderText('Цена от');
    await userEvent.type(minInput, '500');
    const maxInput = screen.getByPlaceholderText('Цена до');
    await userEvent.type(maxInput, '2000');

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 1,
          limit: 12,
          minPrice: 500,
          maxPrice: 2000,
        }),
      });
    });
  });

  it('тип товара (Segmented) добавляет productType в запрос', async () => {
    render(
      <TestRouter initialEntries={['/catalog']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    const dlcSegment = screen.getByText('DLC');
    await userEvent.click(dlcSegment);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 1,
          limit: 12,
          productType: 'DLC',
        }),
      });
    });
  });

  it('пагинация меняет страницу в запросе', async () => {
    mockApi.get.mockImplementation((url: string, config?: any) => {
      if (url === '/categories') return Promise.resolve({ data: mockCategories });
      return Promise.resolve({
        data: { products: mockProducts, total: 25, page: config?.params?.page || 1, limit: 12 },
      });
    });

    render(
      <TestRouter initialEntries={['/catalog']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    await screen.findByText('Test Game');

    const page2Button = screen.getByRole('listitem', { name: /2/ });
    await userEvent.click(page2Button);

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 2,
          limit: 12,
        }),
      });
    });
  });

  it('поиск из URL передаёт search в запросе', async () => {
    render(
      <TestRouter initialEntries={['/catalog?search=test']}>
        <ConfigProvider>
          <App>
            <CatalogPage />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    await waitFor(() => {
      expect(mockApi.get).toHaveBeenCalledWith('/products', {
        params: expect.objectContaining({
          page: 1,
          limit: 12,
          search: 'test',
        }),
      });
    });
  });
});