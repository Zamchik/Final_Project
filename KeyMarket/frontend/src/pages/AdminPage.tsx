// ============================================================================
// Страница админ-панели
// Доступна только пользователям с ролью 'admin'
// ============================================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Spin } from 'antd';
import { useAuthStore } from '../stores/authStore';
import UsersTab from '../components/admin/UsersTab';
import ProductsTab from '../components/admin/ProductsTab';
import OrdersTab from '../components/admin/OrdersTab';

const AdminPage = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const navigate = useNavigate();

  // Защита: если пользователь не admin – редирект на главную
  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  if (!user || user.role !== 'admin') return null;

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