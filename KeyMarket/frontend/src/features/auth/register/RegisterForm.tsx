// Форма регистрации нового пользователя.
// После успешной регистрации показывает модальное окно с ссылкой подтверждения
// и кнопкой для открытия Ethereal (если письмо отправлено).
import { useState } from 'react';
import { Form, Input, Button, Card, message, Modal, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/entities/user/model/authStore';
import { AxiosError } from 'axios';

const { Text } = Typography;

const RegisterForm = () => {
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [verificationUrl, setVerificationUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await register(values.email, values.password);
      if (response?.verificationUrl) {
        setVerificationUrl(response.verificationUrl);
        setPreviewUrl(response.previewUrl || '');
        setIsModalOpen(true);
      } else {
        message.success('Регистрация успешна. Проверьте почту.');
        navigate('/login');
      }
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка регистрации');
    }
  };

  const handleOpenLink = () => {
    setIsModalOpen(false);
    window.location.href = verificationUrl;
  };

  return (
    <Card title="Регистрация">
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item
          name="email"
          rules={[{ required: true, type: 'email', message: 'Введите email' }]}
        >
          <Input placeholder="Email" />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
        >
          <Input.Password placeholder="Пароль" autoComplete="new-password" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block>
          Зарегистрироваться
        </Button>
      </Form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        Уже есть аккаунт? <a href="/login">Войти</a>
      </div>

      <Modal
        title="Подтверждение email"
        open={isModalOpen}
        onOk={handleOpenLink}
        onCancel={() => { setIsModalOpen(false); navigate('/login'); }}
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
        <br /><br />
        <p>Или нажмите «Открыть ссылку», чтобы подтвердить сейчас.</p>
      </Modal>
    </Card>
  );
};

export default RegisterForm;