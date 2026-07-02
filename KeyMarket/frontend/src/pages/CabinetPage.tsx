// Страница личного кабинета
// Показывает профиль, баланс, позволяет пополнить счёт, вывести средства,
// изменить пароль, а также просматривать историю покупок и продаж
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import {
  Button, Descriptions, Spin, Modal, InputNumber, Input, message, Tabs, Card, Row, Col,
  Avatar, Typography,
} from 'antd';
import {
  UserOutlined, WalletOutlined, DollarOutlined, LockOutlined, LogoutOutlined,
} from '@ant-design/icons';
import apiClient from '../api/client';
import { AxiosError } from 'axios';                     // для типизации ошибок axios
import OrdersList from '../components/OrdersList';     // компонент списка заказов

const { Text } = Typography;

const CabinetPage = () => {
  const { user, loading, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Состояния для модального окна пополнения баланса
  const [isModalOpen, setIsModalOpen] = useState(false);             // флаг видимости
  const [amount, setAmount] = useState<number | null>(null);         // сумма пополнения
  const [submitting, setSubmitting] = useState(false);               // индикатор отправки

  // Состояния для модального окна вывода средств
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Состояния для модального окна смены пароля
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  // Защита маршрута и загрузка данных пользователя
  useEffect(() => {
    // Если пользователь не авторизован – редиректим на страницу входа
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    // Если пользователь уже есть, но баланс ещё не загружен – получаем актуальные данные
    if (!loading && user && user.balance === undefined) {
      fetchUser(true);
    }
  }, [loading, user, navigate, fetchUser]);

  // 👇 НОВОЕ: обновляем баланс при возвращении на вкладку (после оплаты в другом окне)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        fetchUser(true);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, fetchUser]);

  // ОБРАБОТЧИКИ ДЕЙСТВИЙ ПОЛЬЗОВАТЕЛЯ

  // Пополнение баланса (через Mock-платёж)
  const handleReplenish = async () => {
    if (!amount || amount <= 0) {
      message.warning('Введите сумму пополнения');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/payments/replenish', { amount });
      // Открываем страницу имитации оплаты в новой вкладке
      window.open(data.paymentUrl, '_blank');
      message.success('Перейдите на открывшуюся страницу для оплаты');
      setIsModalOpen(false);
      setAmount(null);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка создания платежа');
    } finally {
      setSubmitting(false);
    }
  };

  // Вывод средств (только для продавца)
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
      // Обновляем данные пользователя, чтобы баланс отобразился сразу
      fetchUser(true);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка вывода');
    } finally {
      setWithdrawSubmitting(false);
    }
  };

  // Смена пароля
  const handleChangePassword = async () => {
    // Базовая валидация
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

  // РЕНДЕРИНГ

  // Пока проверяется сессия – показываем спиннер
  if (loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  // Если пользователь не авторизован (уже должны были редиректнуть) – ничего не рендерим
  if (!user) return null;

  // Вкладки личного кабинета
  const tabItems = [
    {
      key: 'profile',
      label: 'Профиль',
      children: (
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Аватар и основная информация о пользователе*/}
          <Row gutter={[24, 24]} align="middle">
            <Col>
              <Avatar size={80} icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
            </Col>
            <Col flex="auto">
              <Descriptions bordered column={1} size="small">
                <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                <Descriptions.Item label="Роль">
                  {user.role === 'buyer' ? 'Покупатель' : user.role === 'seller' ? 'Продавец' : 'Администратор'}
                </Descriptions.Item>
                <Descriptions.Item label="Баланс">
                  <Text strong style={{ fontSize: 18, color: '#52c41a' }}>
                    {user.balance ?? 0} ₽
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

                    {/* Карточки действий */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }} align="stretch">
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => setIsModalOpen(true)}
                style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
              >
                <WalletOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 500 }}>Пополнить баланс</div>
                <Text type="secondary">Пополните счёт для покупок</Text>
              </Card>
            </Col>
            {user.role === 'seller' && (
              <Col xs={24} sm={12} md={6}>
                <Card
                  hoverable
                  onClick={() => setIsWithdrawModalOpen(true)}
                  style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
                >
                  <DollarOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                  <div style={{ fontSize: 16, fontWeight: 500 }}>Вывести средства</div>
                  <Text type="secondary">Запросите вывод на карту</Text>
                </Card>
              </Col>
            )}
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => setIsPasswordModalOpen(true)}
                style={{ textAlign: 'center', cursor: 'pointer', height: '100%' }}
              >
                <LockOutlined style={{ fontSize: 32, color: '#722ed1', marginBottom: 8 }} />
                <div style={{ fontSize: 16, fontWeight: 500 }}>Сменить пароль</div>
                <Text type="secondary">Повысьте безопасность аккаунта</Text>
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card
                hoverable
                onClick={() => { logout(); navigate('/login'); }}
                style={{ textAlign: 'center', cursor: 'pointer', borderColor: '#ff4d4f', height: '100%' }}
              >
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

  // Вкладка "Продажи" – только для продавцов
  if (user.role === 'seller') {
    tabItems.push({
      key: 'sales',
      label: 'Продажи',
      children: <OrdersList fetchUrl="/orders/sales" emptyText="У вас пока нет продаж" />,
    });
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
      <Tabs defaultActiveKey="profile" items={tabItems} />

      {/* Модальные окна*/}

      {/* Пополнение баланса */}
      <Modal title="Пополнение баланса" open={isModalOpen} onOk={handleReplenish}
        onCancel={() => { setIsModalOpen(false); setAmount(null); }}
        confirmLoading={submitting} okText="Пополнить" cancelText="Отмена">
        <p>Введите сумму (эмуляция платежа):</p>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          placeholder="Сумма в рублях"
          value={amount}
          onChange={(val: number | null) => setAmount(val)}
        />
      </Modal>

      {/* Вывод средств */}
      <Modal title="Вывод средств" open={isWithdrawModalOpen} onOk={handleWithdraw}
        onCancel={() => { setIsWithdrawModalOpen(false); setWithdrawAmount(null); }}
        confirmLoading={withdrawSubmitting} okText="Вывести" cancelText="Отмена">
        <p>Введите сумму для вывода (эмуляция):</p>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          placeholder="Сумма в рублях"
          value={withdrawAmount}
          onChange={(val: number | null) => setWithdrawAmount(val)}
        />
      </Modal>

      {/* Смена пароля */}
      <Modal title="Смена пароля" open={isPasswordModalOpen} onOk={handleChangePassword}
        onCancel={() => { setIsPasswordModalOpen(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
        confirmLoading={passwordSubmitting} okText="Сменить" cancelText="Отмена">
        <div style={{ marginBottom: 16 }}>
          <Input.Password
            placeholder="Текущий пароль"
            value={oldPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOldPassword(e.target.value)}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <Input.Password
            placeholder="Новый пароль"
            value={newPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
          />
        </div>
        <Input.Password
          placeholder="Подтвердите новый пароль"
          value={confirmPassword}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
        />
      </Modal>
    </div>
  );
};

export default CabinetPage;