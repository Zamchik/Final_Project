// Главная страница KeyMarket (Landing)
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Row, Col, Spin, message, Space } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import ProductCard from '../components/ProductCard';
import apiClient from '../api/client';

const { Title, Paragraph } = Typography;

interface Product {
  id: number;
  title: string;
  price: string;
  imageUrl: string | null;
  productType: string;
  category: { name: string };
}

const HomePage = () => {
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loadingNew, setLoadingNew] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const hasShownError = useRef(false);

  useEffect(() => {
    const fetchNew = async () => {
      setLoadingNew(true);
      try {
        const { data } = await apiClient.get('/products', {
          params: { page: 1, limit: 8, sort: 'newest' },
        });
        setNewProducts(data.products);
      } catch {
        if (!hasShownError.current) {
          message.error('Не удалось загрузить новинки');
          hasShownError.current = true;
        }
      } finally {
        setLoadingNew(false);
      }
    };

    const fetchPopular = async () => {
      setLoadingPopular(true);
      try {
        const { data } = await apiClient.get('/products', {
          params: { page: 1, limit: 4, sort: 'price_desc' },
        });
        setPopularProducts(data.products);
      } catch {
        if (!hasShownError.current) {
          message.error('Не удалось загрузить популярные товары');
          hasShownError.current = true;
        }
      } finally {
        setLoadingPopular(false);
      }
    };

    fetchNew();
    fetchPopular();
  }, []);

  return (
    <div>
      {/* Hero-секция */}
      <div style={{ textAlign: 'center', padding: '40px 20px 60px' }}>
        <Title level={1} style={{ fontSize: 48, marginBottom: 16 }}>
          Покупайте цифровые товары <span style={{ color: '#722ed1' }}>безопасно</span>
        </Title>
        <Paragraph style={{ fontSize: 18, color: '#b0b0b0', maxWidth: 600, margin: '0 auto 32px' }}>
          KeyMarket — это маркетплейс нового поколения. Мы объединили лучшие стороны существующих площадок и убрали их недостатки.
        </Paragraph>
        <Space size="middle">
          <Link to="/catalog">
            <Button type="primary" size="large" style={{ height: 48, paddingLeft: 40, paddingRight: 40 }}>
              Перейти в каталог
            </Button>
          </Link>
          <Link to="/sell">
            <Button size="large" style={{ height: 48, paddingLeft: 40, paddingRight: 40 }}>
              Начать продавать <ArrowRightOutlined />
            </Button>
          </Link>
        </Space>
      </div>

      {/* Популярные товары */}
      <div style={{ padding: '0 20px 40px' }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>
          Популярные товары
        </Title>
        {loadingPopular ? (
          <div style={{ textAlign: 'center' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {popularProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Новинки */}
      <div style={{ padding: '0 20px 60px' }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>
          Новинки
        </Title>
        {loadingNew ? (
          <div style={{ textAlign: 'center' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {newProducts.map((product) => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </div>
    </div>
  );
};

export default HomePage;