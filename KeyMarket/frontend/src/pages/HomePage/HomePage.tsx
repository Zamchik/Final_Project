// Главная страница: Hero-секция, популярные товары, новинки.
// Использует сущность ProductCard и хук useCategories.
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Typography, Button, Row, Col, Spin, message } from 'antd';
import { ArrowRightOutlined } from '@ant-design/icons';
import ProductCard from '@/entities/product/ui/ProductCard';
import apiClient from '@/shared/api/client';
import type { Product } from '@/entities/product/types';

const { Title, Paragraph } = Typography;

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
        const { data } = await apiClient.get('/products', { params: { page: 1, limit: 8, sort: 'newest' } });
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
        const { data } = await apiClient.get('/products', { params: { page: 1, limit: 4, sort: 'price_desc' } });
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
      <div className="hero-section" style={{ textAlign: 'center', padding: '40px 20px 60px' }}>
        <Title level={1} className="hero-title" style={{ fontSize: 72, marginBottom: 20 }}>
          Покупайте цифровые товары <span style={{ color: '#722ed1' }}>безопасно</span>
        </Title>
        <Paragraph className="hero-paragraph" style={{ fontSize: 26, color: '#b0b0b0', maxWidth: 800, margin: '0 auto 40px' }}>
          KeyMarket — это маркетплейс нового поколения. Мы объединили лучшие стороны существующих площадок и убрали их недостатки.
        </Paragraph>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
          <Link to="/catalog"><Button type="primary" size="large" style={{ height: 56, paddingLeft: 48, paddingRight: 48, fontSize: 18 }}>Перейти в каталог</Button></Link>
          <Link to="/sell"><Button size="large" style={{ height: 56, paddingLeft: 48, paddingRight: 48, fontSize: 18 }}>Начать продавать <ArrowRightOutlined /></Button></Link>
        </div>
      </div>

      <div style={{ paddingBottom: 40 }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>Популярные товары</Title>
        {loadingPopular ? <Spin /> : (
          <Row gutter={[24, 24]}>
            {popularProducts.map(p => <Col xs={12} sm={12} md={8} lg={8} xl={6} xxl={4} key={p.id}><ProductCard product={p} /></Col>)}
          </Row>
        )}
      </div>

      <div style={{ paddingBottom: 60 }}>
        <Title level={2} style={{ textAlign: 'left', marginBottom: 24 }}>Новинки</Title>
        {loadingNew ? <Spin /> : (
          <Row gutter={[24, 24]}>
            {newProducts.map(p => <Col xs={12} sm={12} md={8} lg={8} xl={6} xxl={4} key={p.id}><ProductCard product={p} /></Col>)}
          </Row>
        )}
      </div>
    </div>
  );
};

export default HomePage;