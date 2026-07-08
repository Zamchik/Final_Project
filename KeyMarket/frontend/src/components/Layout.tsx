// Главный Layout приложения (шапка, контент, футер)
import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Spin, Row, Col, Typography, Button, Drawer, Input, Badge, Dropdown, Menu, message } from 'antd';
import {
  AppstoreOutlined, UserOutlined, PlusSquareOutlined, ShopOutlined, HeartOutlined,
  DashboardOutlined, MenuOutlined, SearchOutlined, ShoppingCartOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { useWishlistStore } from '../stores/wishlistStore';
import NotificationBell from './NotificationBell';
import '../styles/global.scss';

const { Header, Content, Footer } = AntLayout;
const { Text } = Typography;

const MainLayout = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  // Количество товаров в избранном (для бейджика)
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Проверка сессии при монтировании
  useEffect(() => {
    if (!fetched && !loading) {
      fetchUser();
    }
  }, [fetched, loading, fetchUser]);

  if (loading && !fetched) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  // Поиск: при отправке переходим в каталог с параметром поиска
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(value.trim())}`);
    }
  };

  // Элементы выпадающего меню для авторизованного пользователя
  const userMenuItems = [
    { key: 'cabinet', label: 'Личный кабинет', icon: <UserOutlined />, onClick: () => navigate('/cabinet') },
    ...(user?.role === 'SELLER' ? [
      { key: 'my-products', label: 'Мои товары', icon: <ShopOutlined />, onClick: () => navigate('/my-products') },
      { key: 'create-product', label: 'Добавить товар', icon: <PlusSquareOutlined />, onClick: () => navigate('/create-product') },
    ] : []),
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? [
      { key: 'admin', label: 'Админ-панель', icon: <DashboardOutlined />, onClick: () => navigate('/admin') },
    ] : []),
    { key: 'logout', label: 'Выйти', icon: <LogoutOutlined />, onClick: () => { logout(); navigate('/login'); } },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* Шапка */}
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          height: 64,
        }}
      >
        {/* Левая часть: логотип + Каталог */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            {/* SVG логотипа */}
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#722ed1" />
              <line x1="16" y1="6" x2="16" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="16" cy="7" r="3.75" fill="#722ed1" stroke="#fff" strokeWidth="2.5" />
              <line x1="16" y1="29" x2="8" y2="29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="16" y1="33" x2="8" y2="33" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span style={{ color: '#fff', fontSize: 23, fontWeight: 700, letterSpacing: 1, marginLeft: 4 }}>
              eyMarket
            </span>
          </Link>
          <Button
            type="text"
            icon={<AppstoreOutlined style={{ color: '#fff', fontSize: 20 }} />}
            onClick={() => navigate('/catalog')}
            style={{ color: '#fff' }}
          >
            Каталог
          </Button>
        </div>

        {/* Центр: поиск на всю ширину */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', margin: '0 16px' }}>
          <Input.Search
            placeholder="Поиск по названию..."
            allowClear
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%' }}
            enterButton={<SearchOutlined />}
          />
        </div>

        {/* Правая часть: иконки с подписями */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Кнопка «Создать товар» (только для продавца) */}
          {user?.role === 'SELLER' && (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/create-product')}
            >
              <PlusSquareOutlined style={{ color: '#fff', fontSize: 20 }} />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Создать</Text>
            </div>
          )}

          {/* Избранное */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              if (!user) {
                message.info('Войдите, чтобы посмотреть избранное');
                return;
              }
              navigate('/wishlist');
            }}
          >
            <Badge count={wishlistCount} size="small" offset={[-2, 2]}>
              <HeartOutlined style={{ color: '#fff', fontSize: 20 }} />
            </Badge>
            <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Избранное</Text>
          </div>

          {/* Заказы */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              if (!user) {
                message.info('Войдите, чтобы посмотреть заказы');
                return; // только уведомление, без перехода
              }
              navigate('/cabinet');
            }}
          >
            <ShoppingCartOutlined style={{ color: '#fff', fontSize: 20 }} />
            <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Заказы</Text>
          </div>

          {/* Уведомления (только для авторизованных) */}
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <NotificationBell />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Уведомления</Text>
            </div>
          )}

          {/* Профиль / Войти */}
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <UserOutlined style={{ color: '#fff', fontSize: 20 }} />
                <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Профиль</Text>
              </div>
            </Dropdown>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              <UserOutlined style={{ color: '#fff', fontSize: 20 }} />
              <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>Войти</Text>
            </div>
          )}

          {/* Мобильный бургер (скрыт на больших экранах) */}
          <Button
            className="mobile-menu-btn"
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 20 }} />}
            onClick={() => setMobileMenuVisible(true)}
            style={{ display: 'none' }}
          />
        </div>
      </Header>

      {/* Боковое меню для мобильных устройств */}
      <Drawer
        placement="right"
        open={mobileMenuVisible}
        onClose={() => setMobileMenuVisible(false)}
        bodyStyle={{ padding: 0 }}
        width={250}
      >
        <Menu
          mode="inline"
          items={[
            { key: 'home', label: <Link to="/">Главная</Link> },
            { key: 'catalog', label: <Link to="/catalog">Каталог</Link> },
            ...(user ? [{ key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> }] : []),
            ...(user?.role === 'SELLER' ? [
              { key: 'my-products', label: <Link to="/my-products">Мои товары</Link> },
              { key: 'create-product', label: <Link to="/create-product">Добавить товар</Link> },
            ] : []),
            ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? [
              { key: 'admin', label: <Link to="/admin">Админ-панель</Link> },
            ] : []),
            ...(!user ? [
              { key: 'login', label: <Link to="/login">Войти</Link> },
              { key: 'register', label: <Link to="/register">Регистрация</Link> },
            ] : []),
          ]}
          onClick={() => setMobileMenuVisible(false)}
          style={{ borderRight: 0 }}
        />
      </Drawer>

      <Content style={{ padding: '20px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      {/* Футер */}
      <Footer style={{ textAlign: 'center', background: '#141414', padding: '24px 16px', color: '#b0b0b0' }}>
        <Row gutter={[16, 16]} justify="center">
          <Col><Link to="/" style={{ color: '#b0b0b0' }}>Главная</Link></Col>
          <Col><Link to="/catalog" style={{ color: '#b0b0b0' }}>Каталог</Link></Col>
          <Col><Text type="secondary">|</Text></Col>
          <Col><Text type="secondary">© 2026 KeyMarket. Все права защищены.</Text></Col>
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