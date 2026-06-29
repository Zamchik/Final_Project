// Главный Layout приложения (шапка, контент, футер)
// При монтировании проверяет сессию и управляет видимостью меню
import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Menu, Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';
import NotificationBell from './NotificationBell';

const { Header, Content, Footer } = AntLayout;

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

  // Пункты меню
  const items = [
    { key: 'home', label: <Link to="/">Главная</Link> },
    { key: 'catalog', label: <Link to="/catalog">Каталог</Link> },
    ...(user
      ? [{ key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> }]
      : []),
    ...(user?.role === 'admin'
      ? [{ key: 'admin', label: <Link to="/admin">Админ-панель</Link> }]
      : []),
    ...(user?.role === 'seller'
      ? [
        { key: 'my-products', label: <Link to="/my-products">Мои товары</Link> },
        { key: 'create-product', label: <Link to="/create-product">Добавить товар</Link> },
      ]
      : []),
    ...(!user
      ? [
        { key: 'login', label: <Link to="/login">Войти</Link> },
        { key: 'register', label: <Link to="/register">Регистрация</Link> },
      ]
      : []),
  ];

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
            <line x1="16" y1="20" x2="30" y2="10" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />

            {/* Нижняя диагональ */}
            <line x1="16" y1="20" x2="30" y2="30" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />

            {/* Головка ключа — обводка стала жирнее (2.5 вместо 1.5) */}
            <circle cx="16" cy="7" r="3.75" fill="#722ed1" stroke="#fff" strokeWidth="2.5" />

            {/* Коронки (зубцы) */}
            <line x1="16" y1="29" x2="8" y2="29" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="16" y1="33" x2="8" y2="33" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          {/* Текст */}
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

      <Footer style={{ textAlign: 'center' }}>KeyMarket ©2026</Footer>
    </AntLayout>
  );
};

export default MainLayout;