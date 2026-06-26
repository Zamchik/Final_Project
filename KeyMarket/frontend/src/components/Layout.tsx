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
    // Админ-панель
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
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Menu theme="dark" mode="horizontal" items={items} />
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