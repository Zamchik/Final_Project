// Страница карточки товара (публичная)
// Отображает детальную информацию о товаре и кнопку "Купить".
// После создания заказа показывает блок с кнопками "Оплатить" и "Отменить".
// Опрос статуса заказа запускается сразу, после оплаты появляется ключ.
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Result, Typography, message, Space } from 'antd';
import { ShoppingCartOutlined, GiftOutlined } from '@ant-design/icons';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios';
import ReviewList from '../components/ReviewList';

const { Title, Text } = Typography;

interface ProductDetails {
  id: number;
  title: string;
  description: string;
  price: string;
  rating: string;
  stock: number;
  category: { id: number; name: string };
  status: string;
  imageUrl: string | null;
}

interface PaidOrder {
  id: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  items: {
    id: number;
    price: string;
    productKey?: { id: number; keyValue: string };
    product: { id: number; title: string; price: string };
  }[];
}

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(false);

  // Состояния для заказа
  const [orderLoading, setOrderLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  // useRef для интервала опроса
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Загрузка товара
  useEffect(() => {
    const fetchProduct = async () => {
      setFetching(true);
      try {
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data);
      } catch {
        setError(true);
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  // Очистка интервала при размонтировании
  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  // Создание заказа и запуск опроса
  const handleBuy = async () => {
    if (!user) {
      message.info('Войдите, чтобы совершать покупки');
      navigate('/login');
      return;
    }
    if (!product) return;

    setOrderLoading(true);
    try {
      // 1. Создаём заказ
      const { data: orderData } = await apiClient.post('/orders', {
        productId: product.id,
      });
      const newOrderId = orderData.id;
      setOrderId(newOrderId);

      // 2. Создаём платёж
      const { data: paymentData } = await apiClient.post(
        `/payments/orders/${newOrderId}/create-payment`
      );
      setPaymentUrl(paymentData.paymentUrl);

      // 3. Открываем страницу оплаты
      window.open(paymentData.paymentUrl, '_blank');
      message.success('Перейдите на открывшуюся страницу для оплаты');

      // 4. Запускаем опрос статуса заказа каждые 2 секунды
      pollInterval.current = setInterval(async () => {
        try {
          const { data: updatedOrder } = await apiClient.get(`/orders/${newOrderId}`);
          if (updatedOrder.status === 'delivered') {
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
            }
            setPaidOrder(updatedOrder);
            message.success('Заказ оплачен! Ключ готов.');
            // Копируем первый ключ в буфер обмена
            const keyValue = updatedOrder.items[0]?.productKey?.keyValue;
            if (keyValue) {
              await navigator.clipboard.writeText(keyValue);
            }
          }
        } catch {
          // Игнорируем ошибки опроса, чтобы не мешать пользователю
        }
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setOrderLoading(false);
    }
  };

  // Повторно открыть страницу оплаты
  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      message.info('Страница оплаты открыта повторно');
    }
  };

  // Отменить заказ
  const handleCancelOrder = async () => {
    if (!orderId) return;
    try {
      await apiClient.post(`/orders/${orderId}/cancel`);
      // Останавливаем опрос
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
        pollInterval.current = null;
      }
      setOrderId(null);
      setPaymentUrl(null);
      message.success('Заказ отменён');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка отмены');
    }
  };

  // Рендер
  if (fetching || loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }
  if (error || !product) {
    return <Result status="404" title="Товар не найден" />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      {/* Блок изображения с защитной заглушкой */}
      {product.imageUrl ? (
        <div style={{ position: 'relative', marginBottom: 24, textAlign: 'center' }}>
          <img
            src={product.imageUrl}
            alt={product.title}
            style={{
              maxWidth: '100%',
              maxHeight: 300,
              objectFit: 'contain',
              borderRadius: 12,
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {/* Заглушка, видимая при ошибке загрузки */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 12,
              zIndex: 0,
            }}
          >
            <ShoppingCartOutlined style={{ fontSize: 72, color: '#722ed1' }} />
          </div>
        </div>
      ) : (
        // Если imageUrl вообще не задан — обычная заглушка
        <div
          style={{
            height: 200,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <ShoppingCartOutlined style={{ fontSize: 72, color: '#722ed1' }} />
        </div>
      )}

      <Title level={2}>{product.title}</Title>
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Категория">{product.category.name}</Descriptions.Item>
          <Descriptions.Item label="Цена">
            <Text strong style={{ fontSize: 24, color: '#fff' }}>
              {product.price} ₽
            </Text>
          </Descriptions.Item>
          <Descriptions.Item label="В наличии">{product.stock} шт.</Descriptions.Item>
          <Descriptions.Item label="Рейтинг">{product.rating ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Описание">{product.description || '—'}</Descriptions.Item>
        </Descriptions>

        {/* Кнопка "Купить" */}
        <div style={{ marginTop: 20 }}>
          {product.stock > 0 && !orderId && !paidOrder && (
            <Button
              type="primary"
              size="large"
              icon={<ShoppingCartOutlined />}
              onClick={handleBuy}
              loading={orderLoading}
              style={{ height: 48, paddingLeft: 32, paddingRight: 32 }}
            >
              Купить
            </Button>
          )}
          {product.stock === 0 && !paidOrder && (
            <Button disabled size="large">Нет в наличии</Button>
          )}
        </div>
      </Card>

      {/* Блок ожидания оплаты */}
      {orderId && !paidOrder && (
        <Card style={{ marginTop: 20 }}>
          <Title level={4}>Заказ ожидает оплаты</Title>
          <Space size="middle">
            <Button type="primary" size="large" onClick={handleOpenPayment}>
              Оплатить
            </Button>
            <Button size="large" danger onClick={handleCancelOrder}>
              Отменить заказ
            </Button>
          </Space>
        </Card>
      )}

      {/* Блок оплаченного заказа (ключ и благодарность) */}
      {paidOrder && (
        <Card style={{ marginTop: 20, textAlign: 'center' }}>
          <GiftOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
          <Title level={3}>Спасибо за покупку!</Title>
          <Descriptions bordered column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Заказ №">{paidOrder.id}</Descriptions.Item>
            <Descriptions.Item label="Сумма">{paidOrder.totalPrice} ₽</Descriptions.Item>
            <Descriptions.Item label="Товар">
              {paidOrder.items[0]?.product.title}
            </Descriptions.Item>
            <Descriptions.Item label="Ключ">
              <Text copyable code style={{ fontSize: 16 }}>
                {paidOrder.items[0]?.productKey?.keyValue}
              </Text>
            </Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => navigate('/cabinet')}>
              В личный кабинет
            </Button>
            <Button onClick={() => navigate('/catalog')}>
              Продолжить покупки
            </Button>
          </Space>
        </Card>
      )}

      {/* Список отзывов */}
      <ReviewList productId={product.id} />
    </div>
  );
};

export default ProductPage;