import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, message } from 'antd';
import apiClient from '../api/client';
import { AxiosError } from 'axios';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  const onFinish = async (values: { newPassword: string; confirmPassword: string }) => {
    if (values.newPassword !== values.confirmPassword) {
      message.error('Пароли не совпадают');
      return;
    }
    if (!token) {
      message.error('Неверная ссылка');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', { token, newPassword: values.newPassword });
      message.success('Пароль изменён! Войдите с новым паролем.');
      navigate('/login');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка сброса пароля');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <Card title="Новый пароль">
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="newPassword" rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}>
            <Input.Password placeholder="Новый пароль" />
          </Form.Item>
          <Form.Item name="confirmPassword" rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}>
            <Input.Password placeholder="Повторите пароль" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Сохранить
          </Button>
        </Form>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;