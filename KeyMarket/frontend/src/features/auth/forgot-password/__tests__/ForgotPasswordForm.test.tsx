import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConfigProvider, App } from 'antd';
import { describe, it, expect, vi } from 'vitest';
import { TestRouter } from '@/test/testUtils';
import ForgotPasswordForm from '../ForgotPasswordForm';

vi.mock('@/shared/api/client', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        resetUrl: 'http://localhost:5173/reset-password?token=abc',
        previewUrl: 'https://ethereal.email/message/123',
      },
    }),
  },
}));

describe('ForgotPasswordForm', () => {
  it('отображает поле email и кнопку', () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ForgotPasswordForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /отправить ссылку/i })).toBeInTheDocument();
  });

  it('показывает модальное окно после успешной отправки', async () => {
    render(
      <TestRouter>
        <ConfigProvider>
          <App>
            <ForgotPasswordForm />
          </App>
        </ConfigProvider>
      </TestRouter>
    );
    fireEvent.change(screen.getByPlaceholderText('Email'), { target: { value: 'test@test.com' } });
    fireEvent.click(screen.getByRole('button', { name: /отправить ссылку/i }));
    expect(await screen.findByText(/сброс пароля/i)).toBeInTheDocument();
    expect(screen.getByText(/http:\/\/localhost:5173\/reset-password\?token=abc/)).toBeInTheDocument();
  });
});