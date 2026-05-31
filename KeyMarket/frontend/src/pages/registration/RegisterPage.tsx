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
      message.success('Регистрация успешна');
      navigate('/cabinet');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      const msg = error.response?.data?.error || 'Ошибка регистрации';
      message.error(msg);
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
            rules={[{ required: true, min: 6, message: 'Минимум 6 символов' }]}
          >
            <Input.Password placeholder="Пароль" />
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