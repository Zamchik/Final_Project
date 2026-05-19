// backend/prisma.config.ts
import 'dotenv/config';
import { defineConfig, env } from '@prisma/config';

export default defineConfig({
  // Указываем путь к файлу со схемой данных
  schema: 'prisma/schema.prisma',
  // В этом блоке задаём настройки подключения к БД
  datasource: {
    // Берём URL базы данных из переменной окружения DATABASE_URL
    url: env('DATABASE_URL'),
  },
});