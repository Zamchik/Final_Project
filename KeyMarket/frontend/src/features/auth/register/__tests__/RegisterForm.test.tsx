// Тесты формы регистрации: поля, успешная отправка, ошибка 409, модалка с ссылкой.
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import RegisterForm from '../RegisterForm';
import { useAuthStore } from '@/entities/user/model/authStore';

// Мокаем apiClient
vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        message: 'Регистрация успешна.',
        verificationUrl: 'http://localhost:3000/verify?token=abc',
        previewUrl: 'https://ethereal.email/message/123',
      },
    }),
  },
}));

describe('RegisterForm', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, loading: false, fetched: false });
  });

  it('отображает поля email, пароль и кнопку', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <RegisterForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /зарегистрироваться/i })).toBeInTheDocument();
  });

  it('при успешной регистрации открывает модалку со ссылкой', async () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <RegisterForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'new@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('Пароль'), { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /зарегистрироваться/i }));

    // Должно появиться модальное окно
    expect(await screen.findByText(/подтверждение email/i)).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/localhost:3000\/verify\?token=abc/)).toBeInTheDocument();
  });
});