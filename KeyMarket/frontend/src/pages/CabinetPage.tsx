// Страница личного кабинета
// Показывает профиль, баланс и позволяет пополнить счёт (mock)
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

  // Защита маршрута и однократная загрузка данных
  useEffect(() => {
    // Если сессия не загружается и пользователь не авторизован – редирект на логин
    if (!loading && !user) {
      navigate('/login');
      return;
    }

    // Загружаем актуальные данные пользователя (баланс, роль) только один раз при первом входе
    // user.balance будет undefined до первой загрузки – это признак, что данные ещё не получены
    if (!loading && user && !user.balance) {
      fetchUser();
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
      fetchUser();
    } catch (err) {
      // Типизируем ошибку как AxiosError
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка пополнения');
    } finally {
      setSubmitting(false);
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
    </div>
  );
};

export default CabinetPage;