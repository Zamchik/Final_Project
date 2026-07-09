// Главная страница KeyMarket (Landing)
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Row, Col, Spin, message } from 'antd';
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
  sales: number;
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
      {/* Hero-секция с адаптивными классами и кнопками в wrap */}
      <div className="hero-section" style={{ textAlign: 'center', padding: '40px 20px 60px' }}>
        <Title level={1} className="hero-title" style={{ fontSize: 48, marginBottom: 16 }}>
          Покупайте цифровые товары <span style={{ color: '#722ed1' }}>безопасно</span>
        </Title>
        <Paragraph className="hero-paragraph" style={{ fontSize: 18, color: '#b0b0b0', maxWidth: 600, margin: '0 auto 32px' }}>
          KeyMarket — это маркетплейс нового поколения. Мы объединили лучшие стороны существующих площадок и убрали их недостатки.
        </Paragraph>
        {/* Оборачиваем кнопки в flex-контейнер с переносом */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
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
        </div>
      </div>

      {/* Популярные товары – убрали padding, он теперь от Layout */}
      <div style={{ paddingBottom: 40 }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>
          Популярные товары
        </Title>
        {loadingPopular ? (
          <div style={{ textAlign: 'center' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {popularProducts.map((product) => (
              <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Новинки */}
      <div style={{ paddingBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>
          Новинки
        </Title>
        {loadingNew ? (
          <div style={{ textAlign: 'center' }}><Spin size="large" /></div>
        ) : (
          <Row gutter={[16, 16]}>
            {newProducts.map((product) => (
              <Col xs={12} sm={8} md={6} lg={4} key={product.id}>
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