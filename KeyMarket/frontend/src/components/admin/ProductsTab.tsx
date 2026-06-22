// ============================================================================
// Вкладка просмотра товаров (админ-панель)
// Показывает все товары с возможностью поиска и фильтрации по статусу
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Table, Input, Select, Space, message, Tag } from 'antd';
import apiClient from '../../api/client';

interface ProductItem {
  id: number;
  title: string;
  price: string;
  stock: number;
  status: string;
  category: { name: string };
  seller: { email: string };
}

const ProductsTab = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Загрузка товаров
  // -------------------------------------------------------------------------
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/products', {
        params: { page, limit: 20, search, status: statusFilter },
      });
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      message.error('Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchProducts();
  }, [fetchProducts]);

  // -------------------------------------------------------------------------
  // Колонки таблицы
  // -------------------------------------------------------------------------
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Название', dataIndex: 'title', key: 'title' },
    { title: 'Цена', dataIndex: 'price', key: 'price' },
    { title: 'Остаток', dataIndex: 'stock', key: 'stock' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    { title: 'Категория', render: (_: unknown, r: ProductItem) => r.category?.name },
    { title: 'Продавец', render: (_: unknown, r: ProductItem) => r.seller?.email },
  ];

  // -------------------------------------------------------------------------
  // Рендер
  // -------------------------------------------------------------------------
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск по названию"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Фильтр по статусу"
          allowClear
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: 'active', label: 'Активные' },
            { value: 'inactive', label: 'Неактивные' },
            { value: 'banned', label: 'Забанены' },
          ]}
          style={{ width: 150 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
};

export default ProductsTab;