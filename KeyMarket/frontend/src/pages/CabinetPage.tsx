import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Spin } from 'antd';

const CabinetPage = () => {
  const { user, token, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
    } else {
      fetchUser();
    }
  }, [token, navigate, fetchUser]);

  if (!token) return null; // пока идёт редирект
  if (!user) return <Spin style={{ display: 'block', marginTop: 40 }} />;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
      <Descriptions bordered column={1}>
        <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
        <Descriptions.Item label="Роль">{user.role}</Descriptions.Item>
        <Descriptions.Item label="Баланс">
          {user.balance ?? 0} ₽
        </Descriptions.Item>
      </Descriptions>
      <Button
        danger
        style={{ marginTop: 16 }}
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Выйти
      </Button>
    </div>
  );
};

export default CabinetPage;