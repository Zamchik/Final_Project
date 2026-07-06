// backend/src/config/mail.ts
// Конфигурация тестового почтового сервера (Ethereal) с fallback-режимом.
// Для продакшена заменить на реальный SMTP
import nodemailer from 'nodemailer';

export const createTestTransport = async (): Promise<nodemailer.Transporter> => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal test account created:', testAccount.user);

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  } catch (error) {
    console.warn('Не удалось создать Ethereal аккаунт. Письма будут выводиться в консоль.');
    console.warn('Ошибка:', (error as Error).message);

    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }
};