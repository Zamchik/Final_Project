# Бэкенд KeyMarket (Fastify + Prisma)

# Этап 1: Сборка зависимостей и генерация Prisma Client
FROM node:20 AS backend-builder
WORKDIR /app

# Устанавливаем openssl (нужен для Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./

# Устанавливаем ВСЕ зависимости (включая dev)
RUN npm install

# Копируем Prisma-схему
COPY prisma/schema.prisma ./prisma/

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Этап 2: Продакшен-образ
FROM node:20 AS runner
WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Копируем node_modules и сгенерированный Prisma Client из backend-builder
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/tsconfig.json ./
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/src ./src

# Переменные окружения
ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://keymarket:keymarket123@postgres:5432/keymarket
ENV SESSION_SECRET=change-me-in-production

# Открываем порт
EXPOSE 3000

# Запуск через tsx
CMD ["npx", "tsx", "src/app.ts"]