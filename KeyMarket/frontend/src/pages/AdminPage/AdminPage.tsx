// Админ-панель: три вкладки – пользователи, товары, заказы.
// Использует виджеты админки (UsersTab, ProductsTab, OrdersTab), пока в старых путях.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tabs, Spin } from 'antd';
import { useAuthStore } from '@/entities/user/model/authStore';
import UsersTab from '@/widgets/admin/UsersTab'; // TODO перенести в widgets/admin
import ProductsTab from '@/widgets/admin/ProductsTab';
import OrdersTab from '@/widgets/admin/OrdersTab';
import SupportTab from '@/widgets/admin/SupportTab';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

const AdminPage = () => {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);
  const navigate = useNavigate();

  useEffect(() => {
    if (!fetched && !loading) fetchUser();
    if (fetched && (!user || !ADMIN_ROLES.includes(user.role))) navigate('/');
  }, [fetched, loading, user, navigate, fetchUser]);

  if (loading || !fetched) return <Spin style={{ display: 'block', marginTop: 40 }} />;
  if (!user || !ADMIN_ROLES.includes(user.role)) return null;

  return (
    <div>
      <h1>Админ-панель</h1>
      <Tabs defaultActiveKey="users" items={[
        { key: 'users', label: 'Пользователи', children: <UsersTab /> },
        { key: 'products', label: 'Товары', children: <ProductsTab /> },
        { key: 'orders', label: 'Заказы', children: <OrdersTab /> },
        { key: 'support', label: 'Поддержка', children: <SupportTab /> },
      ]} />
    </div>
  );
};

export default AdminPage;