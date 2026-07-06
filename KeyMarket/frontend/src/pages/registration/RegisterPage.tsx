import { Form, Input, Button, Card, message, Modal, Typography } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { AxiosError } from 'axios';
import { MailOutlined } from '@ant-design/icons';

const { Text } = Typography;

const RegisterPage = () => {
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
    // Закрываем модальное окно и переходим на URL подтверждения в этой же вкладке
    setIsModalOpen(false);
    window.location.href = verificationUrl;
  };


  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
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
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </Card>

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
    </div>
  );
};

export default RegisterPage;