// Конфигурация сессий

import crypto from 'crypto';

/**
 * Генерирует ключ для шифрования сессионных кук.
 * Если переменная SESSION_SECRET задана в .env, используется она (в hex),
 * иначе создаётся случайный 32-байтный ключ (при перезапуске все сессии сбросятся).
 */
export const sessionKey = process.env.SESSION_SECRET
  ? Buffer.from(process.env.SESSION_SECRET, 'hex')
  : crypto.randomBytes(32); // fallback только для разработки

/**
 * Настройки куки сессии.
 */
export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: false,          // в продакшене true (HTTPS)
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60, // 7 дней
};