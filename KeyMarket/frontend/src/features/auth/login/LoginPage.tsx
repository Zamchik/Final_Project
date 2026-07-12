// Форма входа в приложение.
// Содержит поля email/пароль, кнопку входа, обработку ошибок (403 – неподтверждён email,
// бан), возможность повторной отправки письма и модальное окно с ссылкой подтверждения.
import { useState } from 'react';
import { Form, Input, Button, message, Modal, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/user/model/authStore';
import apiClient from '@/shared/api/client';
import { AxiosError } from 'axios';

const { Text } = Typography;

const LoginForm = () => {
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [showResend, setShowResend] = useState(false);
  const [resendEmail, setResendEmail] = useState('');

  // Повторная отправка письма подтверждения
  const handleResend = async () => {
    try {
      const { data } = await apiClient.post('/auth/resend-verification', { email: resendEmail });
      setVerificationUrl(data.verificationUrl);
      setPreviewUrl(data.previewUrl || '');
      setIsModalOpen(true);
    } catch {
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
    <>
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
        <a href="/register">Нет аккаунта? Зарегистрироваться</a>
      </div>
      <div style={{ marginTop: 8, textAlign: 'center' }}>
        <a href="/forgot-password">Забыли пароль?</a>
      </div>
      {showResend && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Button type="link" onClick={handleResend}>
            Отправить письмо повторно
          </Button>
        </div>
      )}

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
    </>
  );
};

export default LoginForm;