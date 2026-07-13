import { useEffect, useState, useCallback } from 'react';
import { Table, Input, Select, Space, message, Tag } from 'antd';
import apiClient from '@/shared/api/client';

interface OrderItem {
  id: number;
  buyer: { email: string };
  totalPrice: string;
  status: string;
  createdAt: string;
  items: { product: { title: string }; price: string }[];
}

const statusColors: Record<string, string> = {
  CREATED: 'blue',
  PAID: 'orange',
  DELIVERED: 'green',
  CANCELLED: 'red',
};

const statusLabels: Record<string, string> = {
  CREATED: 'Создан',
  PAID: 'Оплачен',
  DELIVERED: 'Выполнен',
  CANCELLED: 'Отменён',
};

const OrdersTab = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

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
    fetchOrders();
  }, [fetchOrders]);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Покупатель', render: (_: unknown, r: OrderItem) => r.buyer?.email },
    { title: 'Сумма', dataIndex: 'totalPrice', key: 'totalPrice' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>
          {statusLabels[status] || status}
        </Tag>
      ),
    },
    {
      title: 'Товары',
      render: (_: unknown, r: OrderItem) =>
        r.items?.map((i) => i.product.title).join(', '),
    },
    { title: 'Дата', dataIndex: 'createdAt', key: 'createdAt' },
  ];

  return (
    <div>
      <div style={{ overflowX: 'auto', marginBottom: 16 }}>
        <Space>
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
              { value: 'CREATED', label: 'Создан' },
              { value: 'PAID', label: 'Оплачен' },
              { value: 'DELIVERED', label: 'Выполнен' },
              { value: 'CANCELLED', label: 'Отменён' },
            ]}
            style={{ width: 150 }}
          />
        </Space>
      </div>
      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
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