// Основной Layout приложения. Содержит хедер (с логотипом, поиском, навигацией),
// контент (Outlet), футер и мобильную нижнюю навигацию.
// Все зависимости импортируются из FSD-слоёв.
import { useEffect, useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Layout as AntLayout, Spin, Row, Col, Typography, Button, Drawer, Input, Badge, Dropdown, Menu, message, Divider } from 'antd';
import {
  AppstoreOutlined, UserOutlined, PlusSquareOutlined, ShopOutlined, HeartOutlined,
  DashboardOutlined, MenuOutlined, SearchOutlined, ShoppingCartOutlined, LogoutOutlined,
  GithubOutlined, TwitterOutlined, InstagramOutlined, YoutubeOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import NotificationBell from '@/features/notifications/ui/NotificationBell';
import MobileBottomNav from '@/widgets/MobileBottomNav/ui/MobileBottomNav';
import '@/app/styles/global.scss';

const { Header, Content, Footer } = AntLayout;
const { Text, Title } = Typography;

const MainLayout = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();

  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    if (!fetched && !loading) fetchUser();
  }, [fetched, loading, fetchUser]);

  if (loading && !fetched) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  const handleSearch = (value: string) => {
    if (value.trim()) navigate(`/catalog?search=${encodeURIComponent(value.trim())}`);
  };

  const userMenuItems = [
    { key: 'cabinet', label: 'Личный кабинет', icon: <UserOutlined />, onClick: () => navigate('/cabinet') },
    ...(user?.role === 'SELLER' ? [
      { key: 'my-products', label: 'Мои товары', icon: <ShopOutlined />, onClick: () => navigate('/my-products') },
      { key: 'create-product', label: 'Добавить товар', icon: <PlusSquareOutlined />, onClick: () => navigate('/create-product') },
    ] : []),
    { key: 'wishlist', label: 'Избранное', icon: <HeartOutlined />, onClick: () => navigate('/wishlist') },
    { key: 'orders', label: 'Заказы', icon: <ShoppingCartOutlined />, onClick: () => navigate('/cabinet') },
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
          padding: '0 32px',
          height: 88,
        }}
      >
        {/* Левая часть: логотип + Каталог */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#722ed1" />
              <line x1="16" y1="6" x2="16" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="16" cy="7" r="3.75" fill="#722ed1" stroke="#fff" strokeWidth="2.5" />
              <line x1="16" y1="29" x2="8" y2="29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="16" y1="33" x2="8" y2="33" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span className="hide-on-mobile" style={{ color: '#fff', fontSize: 30, fontWeight: 700, letterSpacing: 1, marginLeft: 6 }}>
              eyMarket
            </span>
          </Link>

          <Button
            type="text"
            icon={<AppstoreOutlined style={{ color: '#fff', fontSize: 28 }} />}
            onClick={() => navigate('/catalog')}
            style={{ color: '#fff', fontSize: 16 }}
            className="hide-on-mobile"
          >
            Каталог
          </Button>
        </div>

        {/* Центр: поиск */}
        <div className="header-search" style={{ flex: 1, display: 'flex', justifyContent: 'center', marginLeft: 24, marginRight: 24, padding: '12px 0' }}>
          <Input.Search
            placeholder="Поиск по названию..."
            allowClear
            size="large"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            style={{ width: '100%' }}
            enterButton={<SearchOutlined />}
          />
        </div>

        {/* Правая часть: иконки с подписями */}
        <div className="desktop-icons" style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 12 }}>
          {user?.role === 'SELLER' && (
            <>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate('/my-products')}
              >
                <ShopOutlined style={{ color: '#fff', fontSize: 28 }} />
                <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Мои товары</Text>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
                onClick={() => navigate('/create-product')}
              >
                <PlusSquareOutlined style={{ color: '#fff', fontSize: 28 }} />
                <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Создать</Text>
              </div>
            </>
          )}

          {/* Избранное */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              if (!user) message.info('Войдите, чтобы посмотреть избранное');
              else navigate('/wishlist');
            }}
          >
            <Badge count={wishlistCount} size="small" offset={[-2, 2]}>
              <HeartOutlined style={{ color: '#fff', fontSize: 28 }} />
            </Badge>
            <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Избранное</Text>
          </div>

          {/* Заказы */}
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
            onClick={() => {
              if (!user) message.info('Войдите, чтобы посмотреть заказы');
              else navigate('/cabinet');
            }}
          >
            <ShoppingCartOutlined style={{ color: '#fff', fontSize: 28 }} />
            <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Заказы</Text>
          </div>

          {/* Уведомления */}
          {user && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
              <NotificationBell />
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Уведомления</Text>
            </div>
          )}

          {/* Админ-панель */}
          {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/admin')}
            >
              <DashboardOutlined style={{ color: '#fff', fontSize: 28 }} />
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Админ</Text>
            </div>
          )}

          {/* Профиль / Войти */}
          {user ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <UserOutlined style={{ color: '#fff', fontSize: 28 }} />
                <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Профиль</Text>
              </div>
            </Dropdown>
          ) : (
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => navigate('/login')}
            >
              <UserOutlined style={{ color: '#fff', fontSize: 28 }} />
              <Text style={{ color: '#fff', fontSize: 16, marginTop: 2 }}>Войти</Text>
            </div>
          )}

          <Button
            className="mobile-menu-btn"
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 28 }} />}
            onClick={() => setMobileMenuVisible(true)}
          />
        </div>
      </Header>

      <Drawer
        placement="right"
        open={mobileMenuVisible}
        onClose={() => setMobileMenuVisible(false)}
        styles={{ body: { padding: 0 } }}
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

      <Content className="main-content" style={{ padding: '32px 32px 80px', maxWidth: 2000, margin: '0 auto', width: '100%' }}>
        <Outlet />
      </Content>

      {/* Футер */}
      <Footer className="desktop-footer" style={{
        background: 'linear-gradient(180deg, #141414 0%, #0d0d0d 100%)',
        padding: '48px 32px 24px',
        color: '#b0b0b0',
        borderTop: '1px solid #333',
      }}>
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

      <MobileBottomNav />
    </AntLayout>
  );
};

export default MainLayout;