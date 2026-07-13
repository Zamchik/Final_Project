// Страница входа. Использует фичу LoginForm.
import { Card } from 'antd';
import { LoginForm } from '@/features/auth/login';

const LoginPage = () => {
  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <Card title="Вход">
        <LoginForm />
      </Card>
    </div>
  );
};

export default LoginPage;