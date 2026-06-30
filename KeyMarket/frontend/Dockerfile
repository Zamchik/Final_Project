# Фронтенд KeyMarket (React + Vite) – раздача через Nginx

# Этап 1: сборка статики
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Копируем только файлы для установки зависимостей (быстрее кеширование)
COPY package.json package-lock.json* ./
RUN npm install

# Копируем весь исходный код
COPY . .

# Собираем production-сборку (Vite генерирует папку dist)
RUN npm run build

# Этап 2: лёгкий веб-сервер Nginx
FROM nginx:alpine

# Копируем собранные файлы в директорию, которую раздаёт Nginx
COPY --from=frontend-builder /app/dist /usr/share/nginx/html

# Удаляем дефолтный конфиг Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем свой конфиг, который решает проблему с React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]