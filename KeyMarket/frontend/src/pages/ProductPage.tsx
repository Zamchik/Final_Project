// Страница карточки товара (публичная)
// Отображает детальную информацию о товаре и кнопку "Купить".
// После создания заказа показывает кнопки "Оплатить" и "Отменить"
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Spin, Result, Typography, message,
  Space,
} from 'antd';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios';

const { Title, Text } = Typography;

// Тип для данных товара с бэкенда (без ключей)
interface ProductDetails {
  id: number;
  title: string;
  description: string;
  price: string;
  rating: string;
  stock: number;
  category: { id: number; name: string };
  status: string;
}

// Тип созданного заказа (до оплаты)
interface CreatedOrder {
  id: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  items: {
    id: number;
    price: string;
    product: { id: number; title: string; price: string };
  }[];
}

// Тип оплаченного заказа (с ключом)
interface PaidOrder {
  id: number;
  totalPrice: string;
  status: string;
  createdAt: string;
  items: {
    id: number;
    price: string;
    productKey: { id: number; keyValue: string };
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
  const [order, setOrder] = useState<CreatedOrder | null>(null);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(false);

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

  // Создание заказа (статус 'created') 
  const handleCreateOrder = async () => {
    if (!user) {
      message.info('Войдите, чтобы совершать покупки');
      navigate('/login');
      return;
    }
    if (!product) return;

    setOrderLoading(true);
    try {
      const { data } = await apiClient.post('/orders', {
        productId: product.id,
      });
      setOrder(data);
      message.success('Заказ создан. Теперь оплатите его.');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setOrderLoading(false);
    }
  };

  // Оплата заказа
  const handlePayOrder = async () => {
    if (!order) return;
    setOrderLoading(true);
    try {
      const { data } = await apiClient.post(`/orders/${order.id}/pay`);
      setPaidOrder(data);
      setOrder(null); // убираем неоплаченный заказ
      message.success('Заказ оплачен! Ключ скопирован в буфер обмена.');
      // Копируем первый ключ в буфер обмена
      const keyValue = data.items[0]?.productKey?.keyValue;
      if (keyValue) {
        await navigator.clipboard.writeText(keyValue);
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка оплаты');
    } finally {
      setOrderLoading(false);
    }
  };

  // Отмена заказа
  const handleCancelOrder = async () => {
    if (!order) return;
    setOrderLoading(true);
    try {
      await apiClient.post(`/orders/${order.id}/cancel`);
      setOrder(null);
      message.success('Заказ отменён');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка отмены');
    } finally {
      setOrderLoading(false);
    }
  };


  // Рендер: загрузка и ошибки

  if (fetching || loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }
  if (error || !product) {
    return <Result status="404" title="Товар не найден" />;
  }

  // Рендер: карточка товара
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>{product.title}</Title>
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Категория">{product.category.name}</Descriptions.Item>
          <Descriptions.Item label="Цена">{product.price} ₽</Descriptions.Item>
          <Descriptions.Item label="В наличии">{product.stock} шт.</Descriptions.Item>
          <Descriptions.Item label="Рейтинг">{product.rating ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Описание">{product.description || '—'}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 20 }}>
          {product.stock > 0 ? (
            !order && !paidOrder && (
              <Button
                type="primary"
                size="large"
                onClick={handleCreateOrder}
                loading={orderLoading}
              >
                Купить
              </Button>
            )
          ) : (
            <Button disabled size="large">Нет в наличии</Button>
          )}
        </div>
      </Card>

      {/* Блок неоплаченного заказа */}
      {order && (
        <Card style={{ marginTop: 20 }}>
          <Title level={4}>Заказ №{order.id} ожидает оплаты</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Сумма">{order.totalPrice} ₽</Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Text type="warning">Создан</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Товар">
              {order.items[0]?.product.title}
            </Descriptions.Item>
          </Descriptions>
          <Space style={{ marginTop: 16 }}>
            <Button
              type="primary"
              size="large"
              onClick={handlePayOrder}
              loading={orderLoading}
            >
              Оплатить
            </Button>
            <Button
              size="large"
              onClick={handleCancelOrder}
              loading={orderLoading}
            >
              Отменить
            </Button>
          </Space>
        </Card>
      )}

      {/* Блок оплаченного заказа (ключ) */}
      {paidOrder && (
        <Card style={{ marginTop: 20 }}>
          <Title level={4}>Заказ №{paidOrder.id} оплачен</Title>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Сумма">{paidOrder.totalPrice} ₽</Descriptions.Item>
            <Descriptions.Item label="Статус">
              <Text type="success">Оплачен</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Товар">
              {paidOrder.items[0]?.product.title}
            </Descriptions.Item>
            <Descriptions.Item label="Ключ">
              <Text copyable code>
                {paidOrder.items[0]?.productKey.keyValue}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default ProductPage;