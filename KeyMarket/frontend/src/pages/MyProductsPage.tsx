import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Input, message, Popconfirm } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

interface ProductItem {
  id: number;
  title: string;
  price: string;
  stock: number;
  status: string;
  category: { id: number; name: string };
}

const MyProductsPage = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const navigate = useNavigate();

  const [products, setProducts] = useState<ProductItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (!fetched && !loading) {
      fetchUser();
    }
    if (fetched && !user) {
      navigate('/login');
    }
  }, [fetched, loading, user, navigate, fetchUser]);

  const fetchProducts = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const { data } = await apiClient.get('/products/my', {
        params: { page, limit: 10, search },
      });
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      message.error('Ошибка загрузки товаров');
    } finally {
      setLoadingData(false);
    }
  }, [page, search, user]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/products/${id}`);
      message.success('Товар удалён');
      fetchProducts();
    } catch {
      message.error('Ошибка удаления');
    }
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Название', dataIndex: 'title', key: 'title' },
    {
      title: 'Категория',
      key: 'category',
      render: (_: unknown, record: ProductItem) => record.category?.name,
    },
    { title: 'Цена', dataIndex: 'price', key: 'price' },
    { title: 'Остаток', dataIndex: 'stock', key: 'stock' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: ProductItem) => (
        <Space>
          <Link to={`/edit-product/${record.id}`}>
            <Button type="link">Редактировать</Button>
          </Link>
          <Popconfirm
            title="Удалить товар?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger>
              Удалить
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading || !fetched) return null;
  if (!user) return null;

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 24 }}>
      <h1>Мои товары</h1>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск по названию"
          onSearch={(value) => setSearch(value)}
          allowClear
          style={{ width: 300 }}
        />
        <Link to="/create-product">
          <Button type="primary">Добавить товар</Button>
        </Link>
      </Space>
      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loadingData}
        scroll={{ x: 'max-content' }}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: (p) => setPage(p),
          showTotal: (t) => `Всего ${t} товаров`,
        }}
      />
    </div>
  );
};

export default MyProductsPage;