// Конфигурация тестового почтового сервера (Ethereal) с fallback-режимом.
// Для продакшена заменить на реальный SMTP
import nodemailer from 'nodemailer';

// Создаёт транспорт Nodemailer.
// Пытается подключиться к Ethereal; при неудаче включает режим вывода писем в JSON (консоль).
// Возвращает готовый transporter.
export const createTestTransport = async (): Promise<nodemailer.Transporter> => {
  try {
    // Генерируем тестовый аккаунт Ethereal (требует доступ к api.nodemailer.com)
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal test account created:', testAccount.user);

    // Создаём SMTP-транспорт с полученными учётными данными
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || testAccount.user,
        pass: process.env.SMTP_PASS || testAccount.pass,
      },
    });
  } catch (error) {
    // Если сеть недоступна (ошибка TLS, DNS и т.п.) — не крашим сервер,
    // а используем транспорт, который пишет письма в лог
    console.warn('Не удалось создать Ethereal аккаунт. Письма будут выводиться в консоль.');
    console.warn('Ошибка:', (error as Error).message);

    return nodemailer.createTransport({
      jsonTransport: true, // письма попадают в стандартный вывод
    });
  }
};