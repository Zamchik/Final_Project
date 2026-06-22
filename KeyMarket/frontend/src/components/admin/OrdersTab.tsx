// ============================================================================
// Вкладка просмотра заказов (админ-панель)
// Показывает все заказы с поиском по покупателю и фильтром по статусу
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Table, Input, Select, Space, message, Tag } from 'antd';
import apiClient from '../../api/client';

interface OrderItem {
  id: number;
  buyer: { email: string };
  totalPrice: string;
  status: string;
  createdAt: string;
  items: { product: { title: string }; price: string }[];
}

const OrdersTab = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Загрузка заказов
  // -------------------------------------------------------------------------
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/orders', {
        params: { page, limit: 20, search, status: statusFilter },
      });
      setOrders(data.orders);
      setTotal(data.total);
    } catch {
      message.error('Ошибка загрузки заказов');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  // -------------------------------------------------------------------------
  // Колонки таблицы
  // -------------------------------------------------------------------------
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Покупатель', render: (_: unknown, r: OrderItem) => r.buyer?.email },
    { title: 'Сумма', dataIndex: 'totalPrice', key: 'totalPrice' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'delivered' ? 'green' : 'blue'}>{status}</Tag>
      ),
    },
    {
      title: 'Товары',
      render: (_: unknown, r: OrderItem) =>
        r.items?.map((i) => i.product.title).join(', '),
    },
    { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  // -------------------------------------------------------------------------
  // Рендер
  // -------------------------------------------------------------------------
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск по email покупателя"
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
            { value: 'created', label: 'Создан' },
            { value: 'delivered', label: 'Выполнен' },
          ]}
          style={{ width: 150 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={orders}
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

export default OrdersTab;