// Форма восстановления пароля.
// Принимает email, отправляет запрос на бэкенд и показывает модальное окно
// с ссылкой для сброса (работает даже без отправки письма).
import { useState } from 'react';
import { Form, Input, Button, message, Modal, Typography } from 'antd';
import { MailOutlined } from '@ant-design/icons';
import apiClient from '@/shared/api/client';

const { Text } = Typography;

const ForgotPasswordForm = () => {
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetUrl, setResetUrl] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      const { data } = await apiClient.post('/auth/forgot-password', { email: values.email });
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
        setPreviewUrl(data.previewUrl || '');
        setModalOpen(true);
      } else {
        message.info('Если такой email зарегистрирован, на него отправлена инструкция.');
      }
    } catch {
      message.error('Ошибка отправки запроса');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <Form onFinish={onFinish} layout="vertical">
        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Введите email' }]}>
          <Input placeholder="Email" />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          Отправить ссылку
        </Button>
      </Form>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <a href="/login">Вспомнили пароль? Войти</a>
      </div>

      <Modal
        title="Сброс пароля"
        open={modalOpen}
        onOk={() => {
          window.location.href = resetUrl;
          setModalOpen(false);
        }}
        onCancel={() => setModalOpen(false)}
        okText="Открыть ссылку"
        cancelText="Закрыть"
      >
        <p>Для сброса пароля перейдите по ссылке:</p>
        <Text copyable style={{ wordBreak: 'break-all' }}>{resetUrl}</Text>
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
        <p>Или нажмите «Открыть ссылку», чтобы перейти к сбросу пароля.</p>
      </Modal>
    </div>
  );
};

export default ForgotPasswordForm;