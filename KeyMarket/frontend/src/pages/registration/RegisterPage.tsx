import { Form, Input, Button, Card, message } from 'antd';
import { useNavigate, Link } from 'react-router-dom';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';

interface RegisterFormValues {
  email: string;
  password: string;
}

const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const onFinish = async (values: RegisterFormValues) => {
    try {
      await register(values.email, values.password);
      message.success('Регистрация успешна! Проверьте почту для подтверждения.');
      navigate('/login');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка регистрации');
    }
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
            rules={[{ required: true, message: 'Введите пароль' }]}
          >
            <Input.Password placeholder="Пароль" autoComplete="current-password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Зарегистрироваться
          </Button>
        </Form>
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;