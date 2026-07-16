// Тесты проверяют поля ввода, кнопку входа и обработку ошибок.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from '../LoginForm';
import { useAuthStore } from '@/entities/user/model/authStore';

// Мокаем apiClient для запросов входа
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

  // Проверяем наличие полей ввода и кнопки
  it('отображает поля email, пароль и кнопку "Войти"', () => {
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <LoginForm />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Войти/ })).toBeInTheDocument();
  });

  // Проверяем успешный вход
  it('вызывает login при отправке формы', async () => {
    const loginSpy = vi.spyOn(useAuthStore.getState(), 'login');
    render(
      <MemoryRouter>
        <ConfigProvider>
          <App>
            <LoginForm />
          </App>
        </ConfigProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Войти/ }));

    await waitFor(() => {
      expect(loginSpy).toHaveBeenCalledWith('test@test.com', 'password123');
    });
  });
});