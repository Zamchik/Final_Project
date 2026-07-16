// Тест формы входа: поля email/пароль, вызов login при отправке.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from '../LoginForm';
import { useAuthStore } from '@/entities/user/model/authStore';
import { TestRouter } from '@/test/testUtils';

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: { user: { id: 1, email: 'test@test.com', role: 'buyer' } },
    }),
    get: vi.fn(),
  },
}));

describe('LoginForm', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      loading: false,
      fetched: false,
    });
  });

  it('отображает поля email, пароль и кнопку "Войти"', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <LoginForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Войти/ })).toBeInTheDocument();
  });

  it('вызывает login при отправке формы', async () => {
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login');
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <LoginForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });
});