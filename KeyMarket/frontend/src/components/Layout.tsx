import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import { useAuthStore } from '../stores/authStore';
import { useEffect } from 'react';

const { Header, Content, Footer } = AntLayout;

const MainLayout = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // При монтировании Layout, если есть токен, но нет данных пользователя, загружаем их
  useEffect(() => {
    if (token && !user) {
      fetchUser();
    }
  }, [token, user, fetchUser]);

  // Собираем пункты меню динамически
  const items = [
    { key: 'home', label: <Link to="/">Главная</Link> },
    { key: 'catalog', label: <Link to="/catalog">Каталог</Link> },
    ...(token
      ? [{ key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> }]
      : []),
    // Пункты для продавца
    ...(token && user?.role === 'seller'
      ? [
          { key: 'my-products', label: <Link to="/my-products">Мои товары</Link> },
          { key: 'create-product', label: <Link to="/create-product">Добавить товар</Link> },
        ]
      : []),
    ...(!token
      ? [
          { key: 'login', label: <Link to="/login">Войти</Link> },
          { key: 'register', label: <Link to="/register">Регистрация</Link> },
        ]
      : []),
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header>
        <Menu theme="dark" mode="horizontal" items={items} />
      </Header>
      <Content style={{ padding: '20px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>KeyMarket ©2026</Footer>
    </AntLayout>
  );
};

export default MainLayout;