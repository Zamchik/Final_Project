// Маршруты аутентификации
import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { AuthController } from '../controllers/auth.controller';
import { AuthService } from '../services/auth.service';

export default async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService(prisma, fastify.emailService);
  const controller = new AuthController(authService);

  // POST /auth/register
  fastify.post('/register', {
    schema: {
      tags: ['auth'],
      summary: 'Регистрация нового пользователя',
      description:
        'Создаёт аккаунт с ролью BUYER. На указанный email отправляется письмо со ссылкой для подтверждения. ' +
        'Email должен быть уникальным. Пароль – минимум 6 символов.',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email нового пользователя' },
          password: { type: 'string', minLength: 6, description: 'Пароль (минимум 6 символов)' },
        },
        examples: [
          {
            email: 'user@example.com',
            password: 'secure123',
          },
        ],
      },
      response: {
        201: {
          type: 'object',
          properties: {
            message: { type: 'string', description: 'Сообщение об успехе' },
            verificationUrl: {
              type: 'string',
              description: 'Ссылка для подтверждения email (в тестовом окружении)',
            },
            previewUrl: {
              type: 'string',
              nullable: true,
              description: 'Ссылка на Ethereal для просмотра отправленного письма',
            },
          },
          examples: [
            {
              message: 'Регистрация успешна. Проверьте почту для подтверждения.',
              verificationUrl: 'http://localhost:3000/auth/verify-email?token=...',
              previewUrl: 'https://ethereal.email/message/...',
            },
          ],
        },
        400: {
          type: 'object',
          properties: { error: { type: 'string' } },
          description: 'Ошибка валидации (например, короткий пароль)',
        },
        409: {
          type: 'object',
          properties: { error: { type: 'string' } },
          description: 'Пользователь с таким email уже существует',
        },
      },
    },
  }, controller.register);

  // GET /auth/verify-email
  fastify.get('/verify-email', {
    schema: {
      tags: ['auth'],
      summary: 'Подтверждение email по токену',
      description:
        'Активирует аккаунт по токену из письма. При успехе перенаправляет на фронтенд (страницу входа с флагом verified=true).',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'JWT-токен подтверждения' },
        },
      },
      response: {
        302: { type: 'null', description: 'Перенаправление на фронтенд' },
        400: { type: 'object', properties: { error: { type: 'string' } }, description: 'Токен недействителен или истёк' },
      },
    },
  }, controller.verifyEmail);

  // POST /auth/login
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Вход в систему',
      description:
        'Авторизует пользователя и устанавливает сессионную куку. ' +
        'Требуется подтверждённый email (verifiedAt не null) и отсутствие бана. ' +
        'При успехе возвращает данные пользователя.',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
        examples: [
          {
            email: 'buyer@keymarket.local',
            password: 'buyer123',
          },
        ],
      },
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                email: { type: 'string' },
                role: { type: 'string' },
              },
            },
          },
          examples: [
            {
              user: {
                id: 3,
                email: 'buyer@keymarket.local',
                role: 'BUYER',
              },
            },
          ],
        },
        401: {
          type: 'object',
          properties: { error: { type: 'string' } },
          description: 'Неверный email или пароль',
        },
        403: {
          type: 'object',
          properties: { error: { type: 'string' } },
          description: 'Email не подтверждён или аккаунт заблокирован',
        },
      },
    },
  }, controller.login);

  // GET /auth/me
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Получить данные текущего пользователя',
      description: 'Возвращает id, email, роль и баланс текущего авторизованного пользователя.',
      security: [{ cookieAuth: [] }],
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            email: { type: 'string' },
            role: { type: 'string' },
            balance: { type: 'string' },
          },
        },
        401: { type: 'object', properties: { error: { type: 'string' } }, description: 'Не авторизован' },
      },
    },
  }, controller.getMe);

  // POST /auth/logout
  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Выход из системы',
      description: 'Удаляет сессионную куку.',
      response: { 200: { type: 'object', properties: {} } },
    },
  }, controller.logout);

  // POST /auth/change-password
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Смена пароля',
      description: 'Меняет пароль текущего пользователя. Требуется старый пароль.',
      body: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string', description: 'Текущий пароль' },
          newPassword: { type: 'string', minLength: 6, description: 'Новый пароль (мин. 6 символов)' },
        },
      },
      response: {
        200: { type: 'object', properties: {} },
        400: { type: 'object', properties: { error: { type: 'string' } }, description: 'Неверный старый пароль или слабый новый' },
      },
    },
  }, controller.changePassword);

  // POST /auth/resend-verification
  fastify.post('/resend-verification', {
    schema: {
      tags: ['auth'],
      summary: 'Повторно отправить письмо для подтверждения email',
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            verificationUrl: { type: 'string' },
            previewUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, controller.resendVerification);

  // POST /auth/request-seller-role
  fastify.post('/request-seller-role', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Запросить роль продавца',
      description: 'Отправляет на email ссылку для подтверждения статуса продавца. Требуется текущий пароль.',
      security: [{ cookieAuth: [] }],
      body: {
        type: 'object',
        required: ['password'],
        properties: { password: { type: 'string', description: 'Текущий пароль для подтверждения личности' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            verificationUrl: { type: 'string' },
            previewUrl: { type: 'string', nullable: true },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } }, description: 'Неверный пароль или уже продавец' },
      },
    },
  }, controller.requestSellerRole);

  // GET /auth/confirm-seller-role
  fastify.get('/confirm-seller-role', {
    schema: {
      tags: ['auth'],
      summary: 'Подтверждение роли продавца по токену из письма',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: { token: { type: 'string' } },
      },
      response: {
        302: { type: 'null', description: 'Перенаправление в личный кабинет с ролью SELLER' },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.confirmSellerRole);

  // POST /auth/forgot-password
  fastify.post('/forgot-password', {
    schema: {
      tags: ['auth'],
      summary: 'Запросить восстановление пароля',
      description: 'Отправляет на email ссылку для сброса пароля (токен действителен 1 час). Если email не найден, всё равно возвращает успех.',
      body: {
        type: 'object',
        required: ['email'],
        properties: { email: { type: 'string', format: 'email' } },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            resetUrl: { type: 'string', description: 'Ссылка для сброса (только если email найден)' },
            previewUrl: { type: 'string', nullable: true },
          },
        },
      },
    },
  }, controller.forgotPassword);

  // POST /auth/reset-password
  fastify.post('/reset-password', {
    schema: {
      tags: ['auth'],
      summary: 'Установить новый пароль по токену',
      body: {
        type: 'object',
        required: ['token', 'newPassword'],
        properties: {
          token: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: { type: 'object', properties: { message: { type: 'string' } } },
        400: { type: 'object', properties: { error: { type: 'string' } }, description: 'Токен недействителен или истёк' },
      },
    },
  }, controller.resetPassword);
}