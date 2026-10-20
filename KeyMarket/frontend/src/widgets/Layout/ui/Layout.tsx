// Основной Layout приложения.
// Содержит шапку (HeaderWidget), контент (Outlet), футер и мобильную нижнюю навигацию.
import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Spin, Row, Col, Typography, Divider } from 'antd';
import {
  GithubOutlined, TwitterOutlined, InstagramOutlined, YoutubeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/entities/user/model/authStore';
import { Header } from '@/widgets/Header';
import { SupportFab } from '@/widgets/SupportFab';
import MobileBottomNav from '@/widgets/MobileBottomNav/ui/MobileBottomNav';
import '@/app/styles/global.scss';


const { Content, Footer } = AntLayout;
const { Text, Title } = Typography;

const MainLayout = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // Проверяем сессию при первом рендере
  useEffect(() => {
    if (!fetched && !loading) {
      fetchUser();
    }
  }, [fetched, loading, fetchUser]);

  // Пока идёт начальная загрузка пользователя, показываем спиннер
  if (loading && !fetched) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Шапка – теперь отдельный виджет */}
      <Header />

      {/* Основной контент */}
      <Content
        className="main-content"
        style={{
          padding: '32px 32px 80px',
          maxWidth: 2000,
          margin: '0 auto',
          width: '100%',
        }}
      >
        <Outlet />
      </Content>

      {/* Футер (виден только на десктопе) */}
      <Footer
        className="desktop-footer"
        style={{
          background: 'linear-gradient(180deg, #141414 0%, #0d0d0d 100%)',
          padding: '48px 32px 24px',
          color: '#b0b0b0',
          borderTop: '1px solid #333',
        }}
      >
        <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 1400, margin: '0 auto' }}>
          {/* О компании */}
          <Col xs={24} sm={6}>
            <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
              <span style={{ color: '#722ed1' }}>Key</span>Market
            </Title>
            <Text type="secondary">
              Маркетплейс цифровых товаров. Безопасные сделки, мгновенная выдача ключей, низкая комиссия 5%.
            </Text>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, fontSize: 24 }}>
              <a href="#" style={{ color: '#b0b0b0' }}><GithubOutlined /></a>
              <a href="#" style={{ color: '#b0b0b0' }}><TwitterOutlined /></a>
              <a href="#" style={{ color: '#b0b0b0' }}><InstagramOutlined /></a>
              <a href="#" style={{ color: '#b0b0b0' }}><YoutubeOutlined /></a>
            </div>
          </Col>
          <Col xs={24} sm={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Покупателям</Title>
            <Link to="/catalog" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Каталог</Link>
            <Link to="/catalog?sort=newest" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Новинки</Link>
            <Link to="/catalog?sort=price_desc" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Популярное</Link>
            <Link to="/catalog?productType=GAME" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Игры</Link>
            <Link to="/catalog?productType=DLC" style={{ color: '#b0b0b0', display: 'block' }}>Дополнения (DLC)</Link>
          </Col>
          <Col xs={24} sm={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Продавцам</Title>
            <Link to="/sell" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Начать продавать</Link>
            <Link to="/create-product" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Добавить товар</Link>
            <Link to="/my-products" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Мои товары</Link>
            <Link to="/cabinet?tab=profile" style={{ color: '#b0b0b0', display: 'block' }}>Вывод средств</Link>
          </Col>
          <Col xs={24} sm={6}>
            <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Поддержка</Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Есть вопросы?</Text>
            <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>support@keymarket.local</Text>
            <Text type="secondary" style={{ display: 'block' }}>Пн–Пт 10:00–19:00 МСК</Text>
          </Col>
        </Row>
        <Divider style={{ borderColor: '#333', marginTop: 32, marginBottom: 16 }} />
        <div style={{ textAlign: 'center', maxWidth: 1400, margin: '0 auto' }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            © 2026 KeyMarket. Все права защищены. Товары, представленные на платформе, являются цифровыми лицензионными ключами.
          </Text>
        </div>
      </Footer>

      {/* Мобильная нижняя навигация */}
      <MobileBottomNav />
      <SupportFab /> 
    </AntLayout>
  );
};

export default MainLayout;