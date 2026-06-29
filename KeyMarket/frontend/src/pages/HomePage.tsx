// Главная страница KeyMarket (Landing)
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Row, Col, Card, Spin } from 'antd';
import {
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  PercentageOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import apiClient from '../api/client';

const { Title, Paragraph, Text } = Typography;

// Тип для популярного товара (только нужные поля)
interface PopularProduct {
  id: number;
  title: string;
  price: string;
  rating: string;
  category: { name: string };
}

const HomePage = () => {
  const [popularProducts, setPopularProducts] = useState<PopularProduct[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPopular = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get('/products', {
          params: { page: 1, limit: 4, sort: 'price_desc' },
        });
        setPopularProducts(data.products);
      } catch (err) {
        console.error('Ошибка загрузки популярных товаров', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPopular();
  }, []);

  return (
    <div>

      {/* Hero-секция */}
      <div style={{ textAlign: 'center', padding: '80px 20px 60px' }}>
        <Title level={1} style={{ fontSize: 48, marginBottom: 16 }}>
          Покупайте цифровые товары <span style={{ color: '#722ed1' }}>безопасно</span>
        </Title>
        <Paragraph style={{ fontSize: 18, color: '#b0b0b0', maxWidth: 600, margin: '0 auto 32px' }}>
          KeyMarket — это маркетплейс нового поколения. Мы объединили лучшие
          стороны существующих площадок и убрали их недостатки.
        </Paragraph>
        <Link to="/catalog">
          <Button type="primary" size="large" style={{ height: 48, paddingLeft: 40, paddingRight: 40 }}>
            Перейти в каталог
          </Button>
        </Link>
      </div>

      {/* Блок преимуществ*/}
      <Row gutter={[24, 24]} justify="center" style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px 60px' }}>
        {[
          {
            icon: <PercentageOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Низкая комиссия',
            text: 'Всего 5% с продажи — это значительно ниже, чем у конкурентов.',
          },
          {
            icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Мгновенная выдача',
            text: 'Ключ приходит сразу после оплаты, без задержек и подтверждений.',
          },
          {
            icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Безопасные сделки',
            text: 'Платформа выступает гарантом: деньги резервируются до получения товара.',
          },
          {
            icon: <RocketOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Простой старт',
            text: 'Зарегистрируйтесь за минуту и начните продавать или покупать.',
          },
        ].map((item) => (
          <Col xs={24} sm={12} key={item.title}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
            >
              <div style={{ marginBottom: 16 }}>{item.icon}</div>
              <Title level={4}>{item.title}</Title>
              <Paragraph type="secondary">{item.text}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Популярные товары                                                */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px 60px' }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
          Популярные товары
        </Title>
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Row gutter={[24, 24]}>
            {popularProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <Link to={`/product/${product.id}`}>
                  <Card
                    hoverable
                    cover={
                      <div
                        style={{
                          height: 140,
                          background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 48,
                        }}
                      >
                        🛒
                      </div>
                    }
                  >
                    <Card.Meta
                      title={product.title}
                      description={
                        <>
                          <Text strong style={{ fontSize: 16, color: '#fff' }}>
                            {product.price} ₽
                          </Text>
                          <br />
                          <Text type="secondary">{product.category.name}</Text>
                        </>
                      }
                    />
                  </Card>
                </Link>
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default HomePage;