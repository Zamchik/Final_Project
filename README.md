# KeyMarket — Маркетплейс цифровых товаров

**KeyMarket** — это полнофункциональный маркетплейс для продажи и покупки цифровых товаров (игровых ключей, дополнений, подписок) с внутренним балансом, комиссией платформы и мгновенной автоматической выдачей ключей после оплаты. Проект выполнен в рамках дипломной работы.

---

## 📦 Стек технологий

| Слой | Технологии |
|------|------------|
| **Фронтенд** | React 19, TypeScript, React Router v6, Zustand, Ant Design 5 (тёмная тема), Axios |
| **Бэкенд** | Node.js 26, Fastify 5, Prisma 7.8.0, Nodemailer, sharp |
| **База данных** | PostgreSQL 18 |
| **Аутентификация** | Сессии в httpOnly‑куках (@fastify/secure‑session), crypto.scrypt для хеширования паролей |
| **Платежи** | Mock Payment Gateway (имитация реального шлюза) |
| **Уведомления** | Email (Nodemailer + Ethereal), in‑app (колокольчик в хедере) |
| **Деплой** | Render (бэкенд + статический фронтенд + PostgreSQL) |
| **Тесты** | Jest + Supertest (бэкенд), Vitest + React Testing Library (фронтенд) |
| **Документация** | Swagger / OpenAPI |

---

## 🖥 Ключевые возможности

### Для покупателя (BUYER)
- **Каталог** — поиск, фильтры по категории, цене, типу товара (Игра / DLC), пагинация, сортировка.
- **Карточка товара** — фото, описание, цена, рейтинг со звёздами, количество продаж и отзывов, кнопки «Купить» и «В избранное».
- **Покупка** — создание заказа → оплата через Mock‑шлюз → мгновенная выдача ключа на странице товара.
- **Личный кабинет** — профиль, баланс, история покупок, смена пароля.
- **Избранное** — сохранение товаров в localStorage (через Zustand).

### Для продавца (SELLER)
- **Управление товарами** — создание/редактирование/удаление товаров, загрузка пулов ключей (Steam‑формат), загрузка изображений с кадрированием.
- **Мои продажи** — список проданных товаров с ключами.
- **Вывод средств** — эмуляция вывода с баланса.
- **Статистика** — количество продаж отображается на карточках.

### Для администратора (ADMIN / SUPER_ADMIN)
- **Управление пользователями** — просмотр, бан/разбан, изменение ролей (SUPER_ADMIN не может быть изменён).
- **Просмотр товаров и заказов** — все товары и заказы системы.

### Уникальные фичи
- **Двухшаговая верификация продавца** — подтверждение пароля + email с JWT‑токеном.
- **Серверная обрезка изображений** — все фото автоматически приводятся к 4:3 через `sharp`, гарантируя одинаковый вид карточек.
- **Адаптивный интерфейс** — десктоп (6 карточек в ряд) → планшет (3–4) → телефон (2) с мобильной нижней навигацией.
- **Переключатель «Описание / Отзывы»** на странице товара.
- **Полноценная админ‑панель** с фильтрацией по ролям и поиском.

---

## 📋 Основные сущности (актуальная модель)

| Сущность | Поля |
|----------|------|
| **User** | id, email, passwordHash, role (BUYER/SELLER/ADMIN/SUPER_ADMIN), balance, bannedAt, verifiedAt |
| **Category** | id, name, slug |
| **Product** | id, sellerId, categoryId, title, description, price, stock, rating, status (ACTIVE/INACTIVE), productType (GAME/DLC), imageUrl |
| **ProductKey** | id, productId, keyValue, soldAt, orderId |
| **Order** | id, buyerId, totalPrice, status (CREATED/PAID/CANCELLED/DELIVERED) |
| **OrderItem** | id, orderId, productId, productKeyId, price |
| **Transaction** | id, userId, type (PURCHASE/SALE/COMMISSION/REPLENISH/WITHDRAWAL), amount, orderId |
| **Payment** | id, userId, amount, status, externalId, orderId |
| **Review** | id, userId, productId, orderId, rating, comment |
| **Notification** | id, userId, type, message, readAt |

---

## 🚀 Запуск проекта

### Локальный запуск (без Docker)
```bash
# 1. Клонируйте репозиторий и перейдите в папку проекта
git clone https://github.com/Zamchik/Final_Project.git
cd Final_Project/KeyMarket

# 2. Установите зависимости бэкенда
cd backend
npm install

# 3. Настройте базу данных PostgreSQL
#    Убедитесь, что PostgreSQL запущен, затем создайте базу и пользователя:
#    (замените пароль при необходимости)
psql -U postgres -c "CREATE USER keymarket WITH PASSWORD 'keymarket123';"
psql -U postgres -c "CREATE DATABASE keymarket OWNER keymarket;"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE keymarket TO keymarket;"

# 4. Примените миграции Prisma
npx prisma migrate deploy

# 5. Настройте переменные окружения для бэкенда
#    Создайте файл .env и заполните его:
cat > .env << 'EOF'
DATABASE_URL=postgresql://keymarket:keymarket123@localhost:5432/keymarket
SESSION_SECRET=ваш_секретный_ключ_из_64_символов
CORS_ORIGINS=http://localhost:5173
APP_BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=ваш_ethereal_email
SMTP_PASS=ваш_ethereal_пароль
EOF

# 6. Запустите бэкенд (в отдельном терминале)
npm run dev
# Сервер запустится на http://localhost:3000, Swagger – http://localhost:3000/docs

# 7. Установите зависимости фронтенда и запустите его
cd ../frontend
npm install
npm run dev
# Фронтенд откроется на http://localhost:5173
```
### Запуск через Docker Compose
```bash
docker compose up --build
```
После сборки сайт будет доступен на http://localhost.

### Деплой на Render
Проект развёрнут на Render:

Фронтенд: https://keymarket-su42.onrender.com

Бэкенд: https://keymarket-api.onrender.com

База данных: PostgreSQL на Render

Для собственного деплоя следуйте инструкциям в разделе «Деплой на Render» (ссылка на документацию).

### 🧪 Тестирование
## Бэкенд
```bash
cd backend
npm test
```
## Фронтенд
```bash
cd frontend
npm test
```

### 📁 Структура проекта
```mermaid
graph TD
    subgraph Client[" "]
        direction LR
        Pages["📄 Страницы: /, /catalog, /product, /cabinet, /admin, /sell, /wishlist"]
        Components["🧩 Компоненты: ProductCard, Layout, NotificationBell, MobileBottomNav, ReviewForm"]
        Stores["🗄 Zustand stores: authStore, wishlistStore"]
        Pages --> Components --> Stores
    end

    Client <-->|"HTTP / REST"| Server

    subgraph Server[" "]
        direction TB
        Routes["🚏 Маршруты: /auth, /products, /orders, /wallet, /admin, /upload, /reviews"]
        Controllers["🎛 Контроллеры: AuthCtrl, ProductCtrl, OrderCtrl, WalletCtrl, AdminCtrl, ReviewCtrl, NotificationCtrl"]
        Services["⚙ Сервисы: AuthService, ProductService, OrderService, PaymentService(Mock), WalletService, EmailService, NotificationService, ReviewService"]
        Middleware["🛡 Middleware: authenticate (проверка сессии и бана), requireRole (ограничение по ролям)"]
        Routes --> Controllers --> Services
        Controllers -.-> Middleware
    end

    Services --> Prisma["🗄 Prisma ORM"]
    Prisma --> DB["💾 PostgreSQL"]
    Services --> External1["💳 Mock Payment Gateway"]
    Services --> External2["📧 Nodemailer (Ethereal)"]
    Services --> External3["🖼️ Загрузка изображений (sharp + статика)"]

    style Client fill:none,stroke:#6c757d,stroke-width:2px,stroke-dasharray:5 5
    style Server fill:none,stroke:#6c757d,stroke-width:2px,stroke-dasharray:5 5
```

### 🔗 Ссылки
Репозиторий: https://github.com/Zamchik/Final_Project

Демо сайта: https://keymarket-su42.onrender.com

Swagger документация: https://keymarket-api.onrender.com/docs (может потребоваться авторизация)

### 🛠️ Что ещё можно улучшить
Интеграция реального платёжного шлюза (Stripe, ЮKassa)

Кеширование данных (Redis)

Очереди для email‑уведомлений (BullMQ)

Более детальные тесты и CI/CD

### Проект создан в рамках дипломной работы. Спасибо за внимание! 👾
