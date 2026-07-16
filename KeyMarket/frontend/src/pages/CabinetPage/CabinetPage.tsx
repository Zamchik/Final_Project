// Личный кабинет: профиль, вкладки "Покупки" и "Продажи", вывод средств, смена пароля.
// Использует фичи product-review (ReviewForm) и общие компоненты.
import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Descriptions, Spin, Modal, InputNumber, Input, message, Tabs, Card, Row, Col,
  Avatar, Typography,
} from 'antd';
import {
  UserOutlined, DollarOutlined, LockOutlined, LogoutOutlined,
} from '@ant-design/icons';
import apiClient from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/authStore';
import { AxiosError } from 'axios';
import OrdersList from '@/widgets/OrdersList/ui/OrdersList';

const { Text } = Typography;

const CabinetPage = () => {
  const { user, loading, fetched, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  useEffect(() => {
    if (!fetched && !loading) fetchUser();
    if (fetched && !user) navigate('/login');
    if (user && user.balance === undefined) fetchUser(true);
  }, [fetched, loading, user, navigate, fetchUser]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) fetchUser(true);
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user, fetchUser]);

  const handleTabChange = useCallback((key: string) => {
    setSearchParams({ tab: key });
  }, [setSearchParams]);

  const handleWithdraw = async () => {
    if (!withdrawAmount || withdrawAmount <= 0) {
      message.warning('Введите сумму вывода');
      return;
    }
    setWithdrawSubmitting(true);
    try {
      const { data } = await apiClient.post('/wallet/withdraw', { amount: withdrawAmount });
      message.success(`Заявка на вывод ${withdrawAmount} ₽ создана. Баланс: ${data.balance} ₽`);
      setIsWithdrawModalOpen(false);
      setWithdrawAmount(null);
      fetchUser(true);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка вывода');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      message.warning('Заполните все поля');
      return;
    }
    if (newPassword !== confirmPassword) {
      message.error('Новый пароль и подтверждение не совпадают');
      return;
    }
    if (newPassword.length < 6) {
      message.error('Новый пароль должен быть не менее 6 символов');
      return;
    }
    setPasswordSubmitting(true);
    try {
      await apiClient.post('/auth/change-password', { oldPassword, newPassword });
      message.success('Пароль успешно изменён');
      setIsPasswordModalOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка смены пароля');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (loading || !fetched) return <Spin style={{ display: 'block', marginTop: 40 }} />;
  if (!user) return null;

  const tabItems = [
    {
      key: 'profile',
      label: 'Профиль',
      children: (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
            </Col>
            <Col flex="auto">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Роль">
                  {user.role === 'BUYER' ? 'Покупатель' : user.role === 'SELLER' ? 'Продавец' : user.role === 'ADMIN' ? 'Администратор' : user.role}
                </Descriptions.Item>
                {user.role === 'SELLER' && (
                  <Descriptions.Item label="Баланс">
                    <Text strong style={{ fontSize: 18, color: '#52c41a' }}>{user.balance ?? 0} ₽</Text>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Col>
          </Row>

          <Row gutter={[16, 16]} style={{ marginTop: 24 }} align="stretch">
            {user.role === 'SELLER' && (
              <Col xs={24} sm={12} md={6}>
                <Card hoverable onClick={() => setIsWithdrawModalOpen(true)}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
                  <DollarOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Вывести средства</div>
                  <Text type="secondary">Запросите вывод на карту</Text>
                </Card>
              </Col>
            )}
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => setIsPasswordModalOpen(true)}
                style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}>
                <LockOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 500 }}>Сменить пароль</div>
                <Text type="secondary">Повысьте безопасность аккаунта</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card hoverable onClick={() => { logout(); navigate('/login'); }}
                style={{ textAlign: 'center', cursor: 'pointer', borderColor: '#ff4d4f', height: '100%' }}>
                <LogoutOutlined style={{ fontSize: 32, color: '#ff4d4f', marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 500, color: '#ff4d4f' }}>Выйти</div>
                <Text type="secondary">Завершить сессию</Text>
              </Card>
            </Col>
          </Row>
        </div>
      ),
    },
    {
      key: 'purchases',
      label: 'Покупки',
      children: <OrdersList fetchUrl="/orders/my" emptyText="У вас пока нет покупок" />,
    },
  ];

  if (user.role === 'SELLER') {
    tabItems.push({
      key: 'sales',
      label: 'Продажи',
      children: <OrdersList fetchUrl="/orders/sales" emptyText="У вас пока нет продаж" />,
    });
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={tabItems} />

      <Modal title="Вывод средств" open={isWithdrawModalOpen} onOk={handleWithdraw}
        onCancel={() => { setIsWithdrawModalOpen(false); setWithdrawAmount(null); }}
        confirmLoading={withdrawSubmitting} okText="Вывести" cancelText="Отмена">
        <p>Введите сумму для вывода (эмуляция):</p>
        <InputNumber style={{ width: '100%' }} min={1} placeholder="Сумма в рублях"
          value={withdrawAmount} onChange={(val) => setWithdrawAmount(val)} />
      </Modal>

      <Modal title="Смена пароля" open={isPasswordModalOpen} onOk={handleChangePassword}
        onCancel={() => { setIsPasswordModalOpen(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
        confirmLoading={passwordSubmitting} okText="Сменить" cancelText="Отмена">
        <div style={{ marginBottom: 16 }}>
          <Input.Password placeholder="Текущий пароль" value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input.Password placeholder="Новый пароль" value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)} />
        </div>
        <Input.Password placeholder="Подтвердите новый пароль" value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)} />
      </Modal>
    </div>
  );
};

export default CabinetPage;