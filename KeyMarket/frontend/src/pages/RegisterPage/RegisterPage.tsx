// Страница регистрации. Использует фичу RegisterForm.
import { RegisterForm } from '@/features/auth/register';

const RegisterPage = () => {
  return (
    <div style={{ maxWidth: 400, margin: '40px auto' }}>
      <RegisterForm />
    </div>
  );
};

export default RegisterPage;