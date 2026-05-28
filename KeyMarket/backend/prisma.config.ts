// import dotenv from 'dotenv';
// import path from 'path';

// // Явно загружаем .env из текущей папки backend
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// import { defineConfig, env } from '@prisma/config';

// export default defineConfig({
//   schema: 'prisma/schema.prisma',
//   datasource: {
//     url: env('DATABASE_URL'),
//   },
// });

import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});