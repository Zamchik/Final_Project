// Страница админ-панели
// Доступна только пользователям с ролью ADMIN или SUPER_ADMIN
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';
import UsersTab from '../components/admin/UsersTab';
import ProductsTab from '../components/admin/ProductsTab';
import OrdersTab from '../components/admin/OrdersTab';

// Список ролей, которым разрешён доступ к админ-панели
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const AdminPage = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const navigate = useNavigate();

  // Защита: дожидаемся проверки сессии и проверяем роль
  useEffect(() => {
    // Если проверка сессии ещё не начата – запускаем
    if (!fetched && !loading) {
      fetchUser();
    }
    // Когда проверка завершена и пользователь не админ – редирект на главную
    if (fetched && (!user || !ADMIN_ROLES.includes(user.role))) {
      navigate('/');
    }
  }, [fetched, loading, user, navigate, fetchUser]);

  // Пока идёт проверка сессии – показываем спиннер
  if (loading || !fetched) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  //  если после проверки пользователь не админ – ничего не рендерим
  if (!user || !ADMIN_ROLES.includes(user.role)) {
    return null;   // редирект уже произойдёт в useEffect, но этот return предотвращает мигание контента
  }

  // Вкладки админ-панели
  const tabItems = [
    {
      key: 'users',
      label: 'Пользователи',
      children: <UsersTab />,
    },
    {
      key: 'products',
      label: 'Товары',
      children: <ProductsTab />,
    },
    {
      key: 'orders',
      label: 'Заказы',
      children: <OrdersTab />,
    },
  ];

  return (
    <div>
      <h1>Админ-панель</h1>
      <Tabs defaultActiveKey="users" items={tabItems} />
    </div>
  );
};

export default AdminPage;