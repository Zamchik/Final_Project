// Страница личного кабинета
// Показывает профиль, баланс, позволяет пополнить счёт и вывести средства (mock)
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Button, Descriptions, Spin, Modal, InputNumber, message } from 'antd';
import apiClient from '../api/client';
import { AxiosError } from 'axios'; // для типизации ошибок axios

const CabinetPage = () => {
  const { user, loading, fetchUser, logout } = useAuthStore();
  const navigate = useNavigate();

  // Локальное состояние для модального окна пополнения
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Состояния для модального окна вывода средств
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<number | null>(null);
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);

  // Защита маршрута и однократная загрузка данных
  useEffect(() => {
    // Если сессия не загружается и пользователь не авторизован – редирект на логин
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Если пользователь уже есть, но баланс ещё не был загружен (undefined)
    // Вызываем fetchUser с принудительным обновлением, чтобы получить актуальные данные
    if (!loading && user && user.balance === undefined) {
      fetchUser(true);
    }
  }, [loading, user, navigate, fetchUser]);

  // Обработчик пополнения баланса
  const handleReplenish = async () => {
    if (!amount || amount <= 0) {
      message.warning('Введите сумму пополнения');
      return;
    }
    setSubmitting(true);
    try {
      // Отправляем запрос пополнения (response нам не нужен)
      await apiClient.post('/wallet/replenish', { amount });
      message.success(`Баланс пополнен на ${amount} ₽`);
      setIsModalOpen(false);
      setAmount(null);
      // Обновляем данные пользователя, чтобы баланс отобразился сразу
      fetchUser(true);
    } catch (err) {
      // Типизируем ошибку как AxiosError
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка пополнения');
    } finally {
      setSubmitting(false);
    }
  };

  // Обработчик вывода средств (имитация)
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

  // Рендер

  // Пока проверяется сессия – показываем спиннер
  if (loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  // Если не авторизован (уже должны были редиректнуть) – ничего не рендерим
  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>Личный кабинет</h1>
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

      {/* Кнопка вывода средств – видна только продавцам */}
      {user.role === 'seller' && (
        <div style={{ marginTop: 16 }}>
          <Button onClick={() => setIsWithdrawModalOpen(true)}>
            Вывести средства
          </Button>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Button
          danger
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Выйти
        </Button>
      </div>

      {/* Модальное окно пополнения */}
      <Modal
        title="Пополнение баланса"
        open={isModalOpen}
        onOk={handleReplenish}
        onCancel={() => {
          setIsModalOpen(false);
          setAmount(null);
        }}
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
        onCancel={() => {
          setIsWithdrawModalOpen(false);
          setWithdrawAmount(null);
        }}
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