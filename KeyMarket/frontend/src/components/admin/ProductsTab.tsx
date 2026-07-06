// Вкладка просмотра товаров (админ-панель)
// Показывает все товары с поиском и фильтрацией по статусу
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
  imageUrl?: string | null;
}

const ProductsTab = () => {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Загрузка товаров
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
    fetchProducts();
  }, [fetchProducts]);

  // Колонки таблицы
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
        <Tag color={status === 'ACTIVE' ? 'green' : 'red'}>
          {status === 'ACTIVE' ? 'Активен' : status === 'INACTIVE' ? 'Неактивен' : status}
        </Tag>
      ),
    },
    { title: 'Категория', render: (_: unknown, r: ProductItem) => r.category?.name },
    { title: 'Продавец', render: (_: unknown, r: ProductItem) => r.seller?.email },
  ];

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
            { value: 'ACTIVE', label: 'Активные' },
            { value: 'INACTIVE', label: 'Неактивные' },
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