import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Button, Spin, Result, Typography, message, Space, Row, Col, Tag, Tabs, Rate,
} from 'antd';
import { ShoppingCartOutlined, GiftOutlined, HeartFilled } from '@ant-design/icons';
import apiClient from '../shared/api/client';
import { useAuthStore } from '../stores/authStore';
import { useWishlistStore } from '../entities/product/model/wishlistStore';
import { AxiosError } from 'axios';
import ReviewList from '../components/ReviewList';

const { Title, Text, Paragraph } = Typography;

interface ProductDetails {
  id: number;
  title: string;
  description: string;
  price: string;
  rating: string;
  stock: number;
  productType: string;
  salesCount: number;
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
  const [reviewCount, setReviewCount] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { addItem, removeItem, isInWishlist } = useWishlistStore();

  const [orderLoading, setOrderLoading] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [paidOrder, setPaidOrder] = useState<PaidOrder | null>(null);

  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setFetching(true);
      try {
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data);

        try {
          const { data: ratingData } = await apiClient.get(`/products/${id}/rating`);
          setReviewCount(ratingData.count || 0);
          setAverageRating(ratingData.average || 0);
        } catch {
          setReviewCount(0);
          setAverageRating(0);
        }
      } catch {
        setError(true);
      } finally {
        setFetching(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  useEffect(() => {
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const handleBuy = async () => {
    if (!user) {
      message.info('Войдите, чтобы совершать покупки');
      navigate('/login');
      return;
    }
    if (!product) return;

    setOrderLoading(true);
    try {
      const { data: orderData } = await apiClient.post('/orders', { productId: product.id });
      const newOrderId = orderData.id;
      setOrderId(newOrderId);

      const { data: paymentData } = await apiClient.post(`/payments/orders/${newOrderId}/create-payment`);
      setPaymentUrl(paymentData.paymentUrl);

      window.open(paymentData.paymentUrl, '_blank');
      message.success('Перейдите на открывшуюся страницу для оплаты');

      pollInterval.current = setInterval(async () => {
        try {
          const { data: updatedOrder } = await apiClient.get(`/orders/${newOrderId}`);
          if (updatedOrder.status === 'DELIVERED') {
            if (pollInterval.current) {
              clearInterval(pollInterval.current);
              pollInterval.current = null;
            }
            setPaidOrder(updatedOrder);
            message.success('Заказ оплачен! Ключ готов.');
            const keyValue = updatedOrder.items[0]?.productKey?.keyValue;
            if (keyValue) {
              await navigator.clipboard.writeText(keyValue);
            }
          }
        } catch {
          // ignore polling errors
        }
      }, 2000);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка создания заказа');
    } finally {
      setOrderLoading(false);
    }
  };

  const handleOpenPayment = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank');
      message.info('Страница оплаты открыта повторно');
    }
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    try {
      await apiClient.post(`/orders/${orderId}/cancel`);
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

  if (fetching || loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }
  if (error || !product) {
    return <Result status="404" title="Товар не найден" />;
  }

  const inWishlist = isInWishlist(product.id);
  const descriptionLength = product.description?.length || 0;
  const isLongDescription = descriptionLength > 200;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Row gutter={[32, 24]} style={{ alignItems: 'stretch' }}>
        {/* Левая колонка: фото */}
        <Col xs={24} md={10}>
          <div style={{
            width: '100%',
            aspectRatio: '4 / 3',
            background: '#1a1a1a',
            borderRadius: 12,
            overflow: 'hidden',
            border: '1px solid #333',
          }}>
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
          </div>
        </Col>

        {/* Правая колонка: информация + кнопки */}
        <Col xs={24} md={14}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {product.productType && (
                <Tag color="purple" style={{ width: 'fit-content', fontSize: 14 }}>
                  {product.productType === 'DLC' ? 'DLC' : 'Игра'}
                </Tag>
              )}
              <Title level={2} style={{ margin: 0, fontWeight: 700, fontSize: 28, lineHeight: 1.3 }}
                ellipsis={{ rows: 2 }}>
                {product.title}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {product.salesCount} {product.salesCount === 1 ? 'продажа' : 'продаж'} · {reviewCount} {reviewCount === 1 ? 'отзыв' : 'отзывов'}
                </Text>
                <Rate disabled value={averageRating} allowHalf style={{ fontSize: 18 }} />
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {averageRating.toFixed(1)}
                </Text>
              </div>
              <Text strong style={{ fontSize: 32, color: '#fff', marginTop: 8 }}>
                {product.price} ₽
              </Text>
            </div>

            {/* Кнопки с увеличенными отступами */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24, marginBottom: 12 }}>
              <Button
                type="text"
                icon={<HeartFilled style={{
                  fontSize: 28,
                  color: inWishlist ? '#722ed1' : '#ffffff',
                  stroke: 'black',
                  strokeWidth: 48,
                }} />}
                onClick={() => {
                  if (!user) {
                    message.info('Войдите, чтобы добавить в избранное');
                    return;
                  }
                  if (inWishlist) {
                    removeItem(product.id);
                  } else {
                    addItem({
                      id: product.id,
                      title: product.title,
                      price: product.price,
                      imageUrl: product.imageUrl,
                      productType: product.productType,
                      category: product.category,
                      sales: product.salesCount,
                    });
                  }
                }}
                style={{ background: 'transparent', border: 'none', padding: 0, lineHeight: 1 }}
              />

              {product.stock > 0 && !orderId && !paidOrder && (
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleBuy}
                  loading={orderLoading}
                  style={{ height: 48, paddingLeft: 32, paddingRight: 32, fontSize: 16 }}
                >
                  Купить
                </Button>
              )}
              {product.stock === 0 && !paidOrder && (
                <Button disabled size="large">Нет в наличии</Button>
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Блоки оплаты / ожидания */}
      {paidOrder && (
        <Card style={{ marginTop: 24, textAlign: 'center' }}>
          <GiftOutlined style={{ fontSize: 48, color: '#722ed1', marginBottom: 16 }} />
          <Title level={3}>Спасибо за покупку!</Title>
          <Descriptions bordered column={1} style={{ marginTop: 16 }}>
            <Descriptions.Item label="Заказ №">{paidOrder.id}</Descriptions.Item>
            <Descriptions.Item label="Сумма">{paidOrder.totalPrice} ₽</Descriptions.Item>
            <Descriptions.Item label="Товар">{paidOrder.items[0]?.product.title}</Descriptions.Item>
            <Descriptions.Item label="Ключ">
              <Text copyable code style={{ fontSize: 16 }}>
                {paidOrder.items[0]?.productKey?.keyValue}
              </Text>
            </Descriptions.Item>
          </Descriptions>
          <Row gutter={[12, 12]} style={{ marginTop: 16 }} justify="center">
            <Col>
              <Button type="primary" onClick={() => navigate('/cabinet')}>В личный кабинет</Button>
            </Col>
            <Col>
              <Button onClick={() => navigate('/catalog')}>Продолжить покупки</Button>
            </Col>
          </Row>
        </Card>
      )}

      {orderId && !paidOrder && (
        <Card style={{ marginTop: 24 }}>
          <Title level={4}>Заказ ожидает оплаты</Title>
          <Space size="middle">
            <Button type="primary" size="large" onClick={handleOpenPayment}>Оплатить</Button>
            <Button size="large" danger onClick={handleCancelOrder}>Отменить заказ</Button>
          </Space>
        </Card>
      )}

      {/* Вкладки с описанием и отзывами */}
      <div style={{ marginTop: 32 }}>
        <Tabs
          defaultActiveKey="description"
          items={[
            {
              key: 'description',
              label: <span style={{ fontSize: 24 }}>Описание</span>,
              children: (
                <div style={{ fontSize: 20, color: '#b0b0b0', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {isLongDescription && !showFullDescription ? (
                    <>
                      <Paragraph style={{ fontSize: 20, color: '#b0b0b0', marginBottom: 8 }}>
                        {product.description?.slice(0, 200)}...
                      </Paragraph>
                      <Button type="link" onClick={() => setShowFullDescription(true)} style={{ padding: 0, fontSize: 18, color: '#722ed1' }}>
                        Показать полностью
                      </Button>
                    </>
                  ) : (
                    <Paragraph style={{ fontSize: 20, color: '#b0b0b0', marginBottom: 0 }}>
                      {product.description || 'Описание отсутствует.'}
                    </Paragraph>
                  )}
                </div>
              ),
            },
            {
              key: 'reviews',
              label: <span style={{ fontSize: 24 }}>Отзывы</span>,
              children: <ReviewList productId={product.id} />,
            },
          ]}
        />
      </div>
    </div>
  );
};

export default ProductPage;