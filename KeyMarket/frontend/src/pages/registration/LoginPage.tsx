import { Form, Input, Button, Card, message, Modal, Typography } from 'antd';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import apiClient from '../../api/client';
import { AxiosError } from 'axios';
import { MailOutlined } from '@ant-design/icons';

const { Text } = Typography;

// Ключ для sessionStorage, чтобы не дублировать уведомление о подтверждении
const VERIFIED_FLAG_KEY = 'keymarket_email_verified';

const LoginPage = () => {
  const login = useAuthStore((s) => s.login);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verified = searchParams.get('verified');

  // Стейты для модального окна подтверждения (повторная отправка)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  // Показываем сообщение о подтверждении email только один раз за сессию
  useEffect(() => {
    if (verified === 'true' && !sessionStorage.getItem(VERIFIED_FLAG_KEY)) {
      message.success('Email успешно подтверждён. Теперь вы можете войти.');
      sessionStorage.setItem(VERIFIED_FLAG_KEY, 'true');
      navigate('/login', { replace: true });
    }
  }, [verified, navigate]);

  // Повторная отправка ссылки подтверждения
  const handleResend = async () => {
    try {
      const { data } = await apiClient.post('/auth/resend-verification', { email: resendEmail });
      setVerificationUrl(data.verificationUrl);
      setPreviewUrl(data.previewUrl || '');
      setIsModalOpen(true);
    } catch (err) {
      message.error('Не удалось отправить письмо. Попробуйте позже.');
    }
  };

  // Обработчик входа
  const onFinish = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password);
      navigate('/cabinet');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      if (error.response?.status === 403) {
        setResendEmail(values.email);
        setShowResend(true);
        return;
      }
      message.error(error.response?.data?.error || 'Ошибка входа');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <Card title="Вход">
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Введите email' }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Введите пароль' }]}>
            <Input.Password placeholder="Пароль" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Войти
          </Button>
        </Form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
        {/* Ссылка для восстановления пароля */}
        <div style={{ marginTop: 8, textAlign: 'center' }}>
          <Link to="/forgot-password">Забыли пароль?</Link>
        </div>
        {showResend && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Button type="link" onClick={handleResend}>
              Отправить письмо повторно
            </Button>
          </div>
        )}
      </Card>

      {/* Модальное окно подтверждения */}
      <Modal
        title="Подтверждение email"
        open={isModalOpen}
        onOk={() => {
          window.location.href = verificationUrl;
          setIsModalOpen(false);
          navigate('/login');
        }}
        onCancel={() => setIsModalOpen(false)}
        okText="Открыть ссылку"
        cancelText="Закрыть"
      >
        <p>Для активации аккаунта перейдите по ссылке:</p>
        <Text copyable style={{ wordBreak: 'break-all' }}>{verificationUrl}</Text>
        {previewUrl && (
          <>
            <br /><br />
            <p>Или откройте письмо в тестовом почтовом ящике:</p>
            <Button type="link" icon={<MailOutlined />} onClick={() => window.open(previewUrl, '_blank')}>
              Открыть письмо в Ethereal
            </Button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default LoginPage;