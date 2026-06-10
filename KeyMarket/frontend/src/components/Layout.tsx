import { useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { Layout as AntLayout, Menu, Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';

const { Header, Content, Footer } = AntLayout;

const MainLayout = () => {
  // Раньше использовали token, теперь проверяем user и loading
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  // При загрузке проверяем сессию (куку)
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Если данные о пользователе еще загружаются, показываем спиннер
  if (loading) {
    return <Spin />;
  }

  // Собираем пункты меню
  const items = [
    { key: 'home', label: <Link to="/">Главная</Link> },
    { key: 'catalog', label: <Link to="/catalog">Каталог</Link> },
    // Если пользователь есть (сессия активна)
    ...(user
      ? [
          { key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> },
        ]
      : []),
    // Пункты только для продавца
    ...(user && user.role === 'seller'
      ? [
          { key: 'my-products', label: <Link to="/my-products">Мои товары</Link> },
          { key: 'create-product', label: <Link to="/create-product">Добавить товар</Link> },
        ]
      : []),
    // Если пользователя нет (гость)
    ...(!user
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