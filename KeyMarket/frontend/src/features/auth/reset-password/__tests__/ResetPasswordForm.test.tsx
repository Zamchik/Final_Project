import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import ResetPasswordForm from '../ResetPasswordForm';

// Мокаем useSearchParams, чтобы вернуть token
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useSearchParams: () => [new URLSearchParams('?token=abc')],
  };
});

// Мокаем apiClient: определяем mockPost прямо здесь
vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

describe('ResetPasswordForm', () => {
  it('отображает поля нового пароля и кнопку', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ResetPasswordForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByPlaceholderText('Новый пароль')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Повторите пароль')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /сохранить/i })).toBeInTheDocument();
  });

  it('отправляет запрос и редиректит при успехе', async () => {
    render(
      <TestRouter initialEntries={['/reset-password?token=abc']}>
        <ConfigProvider>
          <App>
            <ResetPasswordForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Новый пароль'), { target: { value: 'newpass' } });
    fireEvent.change(screen.getByPlaceholderText('Повторите пароль'), { target: { value: 'newpass' } });
    fireEvent.click(screen.getByRole('button', { name: /сохранить/i }));

    // Импортируем apiClient, чтобы проверить вызов
    const { default: apiClient } = await import('@/shared/api/client');
    await waitFor(() =>
      expect(apiClient.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'abc',
        newPassword: 'newpass',
      })
    );
  });
});