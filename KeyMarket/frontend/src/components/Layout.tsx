// Главный Layout приложения (шапка, контент, футер)
// При монтировании проверяет сессию и управляет видимостью меню
import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Menu, Spin, Row, Col, Typography } from 'antd';
import {
  HomeOutlined, AppstoreOutlined, UserOutlined, LoginOutlined,
  FormOutlined, PlusSquareOutlined, ShopOutlined,
  DashboardOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from './NotificationBell';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;

const MainLayout = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  // Загружаем данные пользователя один раз при старте
  useEffect(() => {
    if (!fetched && !loading) {
      fetchUser();
    }
  }, [fetched, loading, fetchUser]);
  // Пока проверяется сессия – показываем спиннер
  if (loading && !fetched) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Пункты меню с иконками
  const items = [
    { key: 'home', label: <Link to="/"><HomeOutlined /> Главная</Link> },
    { key: 'catalog', label: <Link to="/catalog"><AppstoreOutlined /> Каталог</Link> },
    ...(user
      ? [{ key: 'cabinet', label: <Link to="/cabinet"><UserOutlined /> Личный кабинет</Link> }]
      : []),
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? [{ key: 'admin', label: <Link to="/admin"><DashboardOutlined /> Админ-панель</Link> }]
      : []),
    ...(user?.role === 'SELLER'
      ? [
        { key: 'my-products', label: <Link to="/my-products"><ShopOutlined /> Мои товары</Link> },
        { key: 'create-product', label: <Link to="/create-product"><PlusSquareOutlined /> Добавить товар</Link> },
      ]
      : []),
    ...(!user
      ? [
        { key: 'login', label: <Link to="/login"><LoginOutlined /> Войти</Link> },
        { key: 'register', label: <Link to="/register"><FormOutlined /> Регистрация</Link> },
      ]
      : []),
  ];

  // Рендер
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Логотип KeyMarket */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginRight: 24 }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Фиолетовый квадратный фон */}
            <rect width="40" height="40" rx="8" fill="#722ed1" />

            {/* Вертикальная стойка буквы K */}
            <line x1="16" y1="6" x2="16" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />

            {/* Верхняя диагональ */}
            <line x1="18" y1="20" x2="30" y2="10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />

            {/* Нижняя диагональ */}
            <line x1="18" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />

            {/* Головка ключа */}
            <circle cx="16" cy="7" r="3.75" fill="#722ed1" stroke="#fff" strokeWidth="2.5" />

            {/* Коронки (зубцы) */}
            <line x1="16" y1="29" x2="8" y2="29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="33" x2="8" y2="33" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Текстовая часть логотипа */}
          <span style={{ color: '#fff', fontSize: 23, fontWeight: 700, letterSpacing: 1, marginLeft: 4 }}>
            eyMarket
          </span>
        </Link>

        <Menu
          theme="dark"
          mode="horizontal"
          items={items}
          style={{ flex: 1, borderBottom: 'none' }}
        />

        <NotificationBell />
      </Header>

      <Content style={{ padding: '20px' }}>
        <Outlet />
      </Content>

      {/* Улучшенный футер с ссылками и описанием платформы */}
      <Footer
        style={{
          textAlign: 'center',
          background: '#141414',
          padding: '24px 50px',
          color: '#b0b0b0',
        }}
      >
        <Row gutter={[16, 16]} justify="center">
          <Col>
            <Link to="/" style={{ color: '#b0b0b0' }}>Главная</Link>
          </Col>
          <Col>
            <Link to="/catalog" style={{ color: '#b0b0b0' }}>Каталог</Link>
          </Col>
          <Col>
            <Text type="secondary">|</Text>
          </Col>
          <Col>
            <Text type="secondary">© 2026 KeyMarket. Все права защищены.</Text>
          </Col>
        </Row>
        <div style={{ marginTop: 8 }}>
          <Text type="secondary">
            Маркетплейс цифровых товаров. Безопасные сделки, низкая комиссия, мгновенная выдача.
          </Text>
        </div>
      </Footer>
    </AntLayout>
  );
};

export default MainLayout;