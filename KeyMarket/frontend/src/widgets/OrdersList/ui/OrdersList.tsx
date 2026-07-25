// Виджет списка заказов (покупки или продажи) с пагинацией.
// Используется в личном кабинете на вкладках "Покупки" и "Продажи".
// Содержит кнопки "Оплатить", "Отменить", "Оставить отзыв".
// Использует фичу ReviewForm из features/product-review.
import { useEffect, useState, useCallback } from 'react';
import { Table, Tag, Typography, message, Button, Popconfirm, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/shared/api/client';
import { AxiosError } from 'axios';
import { ReviewForm } from '@/features/product-review';

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
    buyer?: { id: number; email: string };
}

interface OrdersListProps {
    fetchUrl: string;
    emptyText?: string;
}

const OrdersList = ({ fetchUrl, emptyText = 'Заказов нет' }: OrdersListProps) => {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [reviewModal, setReviewModal] = useState<{
        visible: boolean;
        productId: number | null;
        orderId: number | null;
    }>({ visible: false, productId: null, orderId: null });

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
        fetchOrders();
    }, [fetchOrders]);

    const handlePayOrder = async (orderId: number) => {
        try {
            const { data } = await apiClient.post(`/payments/orders/${orderId}/create-payment`);
            window.open(data.paymentUrl, '_blank');
            message.success('Перейдите на открывшуюся страницу для оплаты');
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            message.error(error.response?.data?.error || 'Ошибка создания платежа');
        }
    };

    const handleCancelOrder = async (orderId: number) => {
        try {
            await apiClient.post(`/orders/${orderId}/cancel`);
            message.success('Заказ отменён');
            fetchOrders();
        } catch (err) {
            const error = err as AxiosError<{ error: string }>;
            message.error(error.response?.data?.error || 'Ошибка отмены');
        }
    };

    // Определяем, является ли список "продажами" (у продавца есть поле buyer)
    const isSalesView = orders.length > 0 && orders[0].buyer !== undefined;

    const columns: ColumnsType<OrderItem> = [
        { title: 'ID заказа', dataIndex: 'id', key: 'id', width: 80 },
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
                    CREATED: 'blue',
                    DELIVERED: 'green',
                    CANCELLED: 'red',
                };
                const labelMap: Record<string, string> = {
                    CREATED: 'Создан',
                    DELIVERED: 'Выполнен',
                    CANCELLED: 'Отменён',
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
                if (record.status !== 'DELIVERED') return '—';
                return record.items.map((item) =>
                    item.productKey ? (
                        <Text copyable code key={item.id}>
                            {item.productKey.keyValue}
                        </Text>
                    ) : null
                );
            },
        },
        {
            title: 'Действия',
            key: 'actions',
            render: (_, record) => {
                if (record.status === 'CREATED') {
                    return (
                        <Space>
                            <Button type="primary" size="small" onClick={() => handlePayOrder(record.id)}>
                                Оплатить
                            </Button>
                            <Popconfirm
                                title="Отменить заказ?"
                                onConfirm={() => handleCancelOrder(record.id)}
                            >
                                <Button type="link" danger size="small">
                                    Отменить
                                </Button>
                            </Popconfirm>
                        </Space>
                    );
                }
                // Показываем кнопку «Оставить отзыв» только для покупок (не для продаж)
                if (record.status === 'DELIVERED' && !isSalesView) {
                    return (
                        <Button
                            type="link"
                            size="small"
                            onClick={() =>
                                setReviewModal({
                                    visible: true,
                                    productId: record.items[0]?.product.id,
                                    orderId: record.id,
                                })
                            }
                        >
                            Оставить отзыв
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    // Добавляем колонку "Покупатель" для продаж
    if (isSalesView) {
        columns.splice(4, 0, {
            title: 'Покупатель',
            key: 'buyer',
            render: (_, record) => record.buyer?.email,
        });
    }

    return (
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Table
                columns={columns}
                dataSource={orders}
                rowKey="id"
                loading={loading}
                scroll={{ x: 'max-content' }}
                pagination={{
                    current: page,
                    total,
                    pageSize: 10,
                    onChange: (p) => setPage(p),
                    showTotal: (t) => `Всего ${t} заказов`,
                }}
                locale={{ emptyText }}
            />
            <ReviewForm
                productId={reviewModal.productId!}
                orderId={reviewModal.orderId!}
                visible={reviewModal.visible}
                onClose={() => setReviewModal({ visible: false, productId: null, orderId: null })}
                onSuccess={fetchOrders}
            />
        </div>
    );
};

export default OrdersList;