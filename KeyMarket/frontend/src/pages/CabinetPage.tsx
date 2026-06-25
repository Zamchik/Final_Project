// Страница личного кабинета
// Показывает профиль, баланс, позволяет пополнить счёт, вывести средства,
// а также просматривать историю покупок и продаж
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Spin, Modal, InputNumber, message, Tabs } from 'antd';
import apiClient from '../api/client';
import { AxiosError } from 'axios';
import OrdersList from '../components/OrdersList';

const CabinetPage = () => {
  const { user, loading, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Состояния для пополнения
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Состояния для вывода
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Защита маршрута и однократная загрузка данных
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (!loading && user && user.balance === undefined) {
      fetchUser(true);
    }
  }, [loading, user, navigate, fetchUser]);

  // Обработчик пополнения
  const handleReplenish = async () => {
    if (!amount || amount <= 0) {
      message.warning('Введите сумму пополнения');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/wallet/replenish', { amount });
      message.success(`Баланс пополнен на ${amount} ₽`);
      setIsModalOpen(false);
      setAmount(null);
      fetchUser(true);
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка пополнения');
    } finally {
      setSubmitting(false);
    }
  };

  // Обработчик вывода средств
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

  // Рендер
  if (loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }
  if (!user) return null;

  // Вкладки личного кабинета
  const tabItems = [
    {
      key: 'profile',
      label: 'Профиль',
      children: (
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
            <Descriptions.Item label="Роль">{user.role}</Descriptions.Item>
            <Descriptions.Item label="Баланс">{user.balance ?? 0} ₽</Descriptions.Item>
          </Descriptions>
          <div style={{ marginTop: 16 }}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
              Пополнить баланс
            </Button>
          </div>
          {user.role === 'seller' && (
            <div style={{ marginTop: 16 }}>
              <Button onClick={() => setIsWithdrawModalOpen(true)}>
                Вывести средства
              </Button>
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <Button danger onClick={() => { logout(); navigate('/login'); }}>
              Выйти
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'purchases',
      label: 'Покупки',
      children: <OrdersList fetchUrl="/orders/my" emptyText="У вас пока нет покупок" />,
    },
  ];

  // Вкладка «Продажи» только для продавцов
  if (user.role === 'seller') {
    tabItems.push({
      key: 'sales',
      label: 'Продажи',
      children: <OrdersList fetchUrl="/orders/sales" emptyText="У вас пока нет продаж" />,
    });
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
      <Tabs defaultActiveKey="profile" items={tabItems} />

      {/* Модальное окно пополнения */}
      <Modal
        title="Пополнение баланса"
        open={isModalOpen}
        onOk={handleReplenish}
        onCancel={() => { setIsModalOpen(false); setAmount(null); }}
        confirmLoading={submitting}
        okText="Пополнить"
        cancelText="Отмена"
      >
        <p>Введите сумму (эмуляция платежа):</p>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          placeholder="Сумма в рублях"
          value={amount}
          onChange={(val) => setAmount(val)}
        />
      </Modal>

      {/* Модальное окно вывода средств */}
      <Modal
        title="Вывод средств"
        open={isWithdrawModalOpen}
        onOk={handleWithdraw}
        onCancel={() => { setIsWithdrawModalOpen(false); setWithdrawAmount(null); }}
        confirmLoading={withdrawSubmitting}
        okText="Вывести"
        cancelText="Отмена"
      >
        <p>Введите сумму для вывода (эмуляция):</p>
        <InputNumber
          style={{ width: '100%' }}
          min={1}
          placeholder="Сумма в рублях"
          value={withdrawAmount}
          onChange={(val) => setWithdrawAmount(val)}
        />
      </Modal>
    </div>
  );
};

export default CabinetPage;