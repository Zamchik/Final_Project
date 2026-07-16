// Единый виджет шапки приложения.
// Содержит логотип, кнопку «Каталог», поиск, иконки навигации
// (избранное, заказы, уведомления, профиль, админ-панель),
// а также мобильное меню (Drawer).
// Используется в MainLayout.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Layout, Button, Typography, Input, Badge, Dropdown, Drawer, Menu, message } from 'antd';
import {
  AppstoreOutlined, UserOutlined, PlusSquareOutlined, ShopOutlined, HeartOutlined,
  DashboardOutlined, MenuOutlined, SearchOutlined, ShoppingCartOutlined, LogoutOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import NotificationBell from '@/features/notifications/ui/NotificationBell';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const HeaderWidget = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [mobileMenuVisible, setMobileMenuVisible] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  // Обработчик поиска
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/catalog?search=${encodeURIComponent(value.trim())}`);
    }
  };

  // Пункты выпадающего меню пользователя
  const userMenuItems = [
    {
      key: 'cabinet',
      label: 'Личный кабинет',
      icon: <UserOutlined />,
      onClick: () => navigate('/cabinet'),
    },
    ...(user?.role === 'SELLER'
      ? [
          {
            key: 'my-products',
            label: 'Мои товары',
            icon: <ShopOutlined />,
            onClick: () => navigate('/my-products'),
          },
          {
            key: 'create-product',
            label: 'Добавить товар',
            icon: <PlusSquareOutlined />,
            onClick: () => navigate('/create-product'),
          },
        ]
      : []),
    {
      key: 'wishlist',
      label: 'Избранное',
      icon: <HeartOutlined />,
      onClick: () => navigate('/wishlist'),
    },
    {
      key: 'orders',
      label: 'Заказы',
      icon: <ShoppingCartOutlined />,
      onClick: () => navigate('/cabinet'),
    },
    ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
      ? [
          {
            key: 'admin',
            label: 'Админ-панель',
            icon: <DashboardOutlined />,
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
    {
      key: 'logout',
      label: 'Выйти',
      icon: <LogoutOutlined />,
      onClick: () => {
        logout();
        navigate('/login');
      },
    },
  ];

  return (
    <>
      <AntHeader
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
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <svg width="48" height="48" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#722ed1" />
              <line x1="16" y1="6" x2="16" y2="32" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="18" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="16" cy="7" r="3.75" fill="#722ed1" stroke="#fff" strokeWidth="2.5" />
              <line x1="16" y1="29" x2="8" y2="29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="16" y1="33" x2="8" y2="33" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <span
              className="hide-on-mobile"
              style={{
                color: '#fff',
                fontSize: 30,
                fontWeight: 700,
                letterSpacing: 1,
                marginLeft: 6,
              }}
            >
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
        <div
          className="header-search"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            marginLeft: 24,
            marginRight: 24,
            padding: '12px 0',
          }}
        >
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
        <div
          className="desktop-icons"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            paddingTop: 12,
          }}
        >
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

          {/* Мобильный бургер */}
          <Button
            className="mobile-menu-btn"
            type="text"
            icon={<MenuOutlined style={{ color: '#fff', fontSize: 28 }} />}
            onClick={() => setMobileMenuVisible(true)}
          />
        </div>
      </AntHeader>

      {/* Мобильное меню (Drawer) */}
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
            ...(user
              ? [{ key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> }]
              : []),
            ...(user?.role === 'SELLER'
              ? [
                  { key: 'my-products', label: <Link to="/my-products">Мои товары</Link> },
                  { key: 'create-product', label: <Link to="/create-product">Добавить товар</Link> },
                ]
              : []),
            ...(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN'
              ? [{ key: 'admin', label: <Link to="/admin">Админ-панель</Link> }]
              : []),
            ...(!user
              ? [
                  { key: 'login', label: <Link to="/login">Войти</Link> },
                  { key: 'register', label: <Link to="/register">Регистрация</Link> },
                ]
              : []),
          ]}
          onClick={() => setMobileMenuVisible(false)}
          style={{ borderRight: 0 }}
        />
      </Drawer>
    </>
  );
};

export default HeaderWidget;