import crypto from 'crypto';

export const sessionKey = process.env.SESSION_SECRET
  ? Buffer.from(process.env.SESSION_SECRET, 'hex')
  : crypto.randomBytes(32);

export const sessionCookieOptions = {
  path: '/',
  httpOnly: true,
  secure: true,               // Render даёт HTTPS
  sameSite: 'none' as const,  // разрешаем кросс‑доменные запросы
  maxAge: 7 * 24 * 60 * 60,   // 7 дней
};