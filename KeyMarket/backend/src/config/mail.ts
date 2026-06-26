// ============================================================================
// Конфигурация тестового почтового сервера (Ethereal)
// Для продакшена заменить на реальный SMTP (Mailgun, SendGrid, Яндекс.Почта и т.д.)
// ============================================================================

import nodemailer from 'nodemailer';

/**
 * Создаёт тестовый транспорт Nodemailer через Ethereal.
 * При каждом запуске генерируется новый тестовый аккаунт.
 */
export const createTestTransport = async () => {
  // Генерируем тестовый аккаунт Ethereal (не требует регистрации)
  const testAccount = await nodemailer.createTestAccount();

  console.log('Ethereal test account created (user, pass):', testAccount.user);

  // Создаём транспорт, используя сгенерированные учётные данные
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false, // true для 465 порта, false для остальных
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  return transporter;
};