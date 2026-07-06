# Бэкенд KeyMarket (Fastify + Prisma)
FROM node:26.4.0-bookworm-slim AS backend-builder
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate
COPY . .

# Продакшен-образ
FROM node:26.4.0-bookworm-slim AS runner
WORKDIR /app
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
COPY --from=backend-builder /app/node_modules ./node_modules
COPY --from=backend-builder /app/package.json ./
COPY --from=backend-builder /app/tsconfig.json ./
COPY --from=backend-builder /app/prisma ./prisma
COPY --from=backend-builder /app/src ./src
RUN npm prune --production
RUN mkdir -p /app/uploads
EXPOSE 3000
CMD ["npx", "tsx", "src/app.ts"]