// Страница деталей заказа: информация о товаре, ключ, чат с продавцом.
// Доступна покупателю и продавцу заказа.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Spin, Result, Typography, Descriptions, Card, Row, Col, Image, Tag, Button,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import apiClient from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/authStore';
import { ChatWidget } from '@/widgets/Chat';
import type { OrderDetails, OrderItem } from './types';

const { Title, Text } = Typography;

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, fetched, fetchUser } = useAuthStore();
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Проверка авторизации
  useEffect(() => {
    if (!fetched && !authLoading) {
      fetchUser();
    }
    if (fetched && !user) {
      navigate('/login');
    }
  }, [fetched, authLoading, user, navigate, fetchUser]);

  // Загрузка заказа
  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/orders/${id}`);
      // Теперь ответ содержит buyerId и sellerId
      setOrder(data);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (user) fetchOrder();
  }, [user, fetchOrder]);

  if (authLoading || !fetched || loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  if (error || !order) {
    return <Result status="404" title="Заказ не найден" />;
  }

  const isBuyer = user?.id === order.buyerId;
  const isSeller = user?.id === order.sellerId;
  const canChat = order.status === 'DELIVERED' && (isBuyer || isSeller);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/cabinet')}
        style={{ marginBottom: 16 }}
      >
        Назад в личный кабинет
      </Button>

      <Card>
        <Title level={3}>Заказ №{order.id}</Title>
        <Descriptions bordered column={1} size="small" style={{ marginBottom: 24 }}>
          <Descriptions.Item label="Статус">
            <Tag color={order.status === 'DELIVERED' ? 'green' : 'blue'}>
              {order.status === 'DELIVERED' ? 'Выполнен' : order.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Сумма">{order.totalPrice} ₽</Descriptions.Item>
          <Descriptions.Item label="Дата">{new Date(order.createdAt).toLocaleString('ru-RU')}</Descriptions.Item>
        </Descriptions>

        {order.items?.map((item: OrderItem) => (
          <Row key={item.id} gutter={24} style={{ marginBottom: 24 }}>
            <Col xs={24} sm={8}>
              <Image src={item.product.imageUrl || '/placeholder.png'} alt={item.product.title} style={{ width: '100%' }} />
            </Col>
            <Col xs={24} sm={16}>
              <Title level={4}>{item.product.title}</Title>
              <Text>Цена: {item.price} ₽</Text>
              {item.productKey && (
                <div style={{ marginTop: 12 }}>
                  <Text strong>Ключ: </Text>
                  <Text copyable code>{item.productKey.keyValue}</Text>
                </div>
              )}
            </Col>
          </Row>
        ))}
      </Card>

      {canChat && (
        <Card title="Чат с продавцом" style={{ marginTop: 24 }}>
          <ChatWidget
            type="ORDER"
            orderId={order.id}
            buyerId={order.buyerId}
            sellerId={order.sellerId}
            currentUserId={user!.id}
            currentUserRole={user!.role}
          />
        </Card>
      )}
    </div>
  );
};

export default OrderDetailPage;