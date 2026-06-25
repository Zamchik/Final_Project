// Компонент списка заказов (покупки или продажи)
// Принимает fetchUrl – эндпоинт для загрузки данных
import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '../api/client';

const { Text } = Typography;

interface OrderItem {
    id: number;
    totalPrice: string;
    status: string;
    createdAt: string;
    items: {
        id: number;
        price: string;
        product: { id: number; title: string };
        productKey?: { id: number; keyValue: string };
    }[];
    buyer?: { id: number; email: string }; // только для продавца
}

interface OrdersListProps {
    fetchUrl: string;   // например, '/orders/my' или '/orders/sales'
    emptyText?: string; // текст, если заказов нет
}

const OrdersList = ({ fetchUrl, emptyText = 'Заказов нет' }: OrdersListProps) => {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Загрузка заказов
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await apiClient.get(fetchUrl, {
                params: { page, limit: 10 },
            });
            setOrders(data.orders);
            setTotal(data.total);
        } catch {
            message.error('Ошибка загрузки заказов');
        } finally {
            setLoading(false);
        }
    }, [fetchUrl, page]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        fetchOrders();
    }, [fetchOrders]);

    // Колонки таблицы
    const columns: ColumnsType<OrderItem> = [
        {
            title: 'ID заказа',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Сумма',
            dataIndex: 'totalPrice',
            key: 'totalPrice',
            render: (price: string) => `${price} ₽`,
        },
        {
            title: 'Статус',
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => {
                const colorMap: Record<string, string> = {
                    created: 'blue',
                    delivered: 'green',
                    cancelled: 'red',
                };
                const labelMap: Record<string, string> = {
                    created: 'Создан',
                    delivered: 'Выполнен',
                    cancelled: 'Отменён',
                };
                return <Tag color={colorMap[status] || 'default'}>{labelMap[status] || status}</Tag>;
            },
        },
        {
            title: 'Дата',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (date: string) => new Date(date).toLocaleString('ru-RU'),
        },
        {
            title: 'Товары',
            key: 'products',
            render: (_, record) => record.items.map((item) => item.product.title).join(', '),
        },
        {
            title: 'Ключ',
            key: 'key',
            render: (_, record) => {
                if (record.status !== 'delivered') return '—';
                return record.items.map((item) =>
                    item.productKey ? (
                        <Text copyable code key={item.id}>
                            {item.productKey.keyValue}
                        </Text>
                    ) : null
                );
            },
        },
    ];

    // Если в заказах есть покупатель (для продавца), добавляем колонку
    if (orders.length > 0 && orders[0].buyer) {
        columns.splice(4, 0, {
            title: 'Покупатель',
            key: 'buyer',
            render: (_, record) => record.buyer?.email,
        });
    }

    // Рендер
    return (
        <Table
            columns={columns}
            dataSource={orders}
            rowKey="id"
            loading={loading}
            pagination={{
                current: page,
                total,
                pageSize: 10,
                onChange: (p) => setPage(p),
                showTotal: (t) => `Всего ${t} заказов`,
            }}
            locale={{ emptyText }}
        />
    );
};

export default OrdersList;