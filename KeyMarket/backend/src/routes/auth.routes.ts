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
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.register);

  // GET /auth/verify-email
  fastify.get('/verify-email', {
    schema: {
      tags: ['auth'],
      summary: 'Подтверждение email по токену',
      querystring: {
        type: 'object',
        required: ['token'],
        properties: {
          token: { type: 'string', description: 'Токен подтверждения' },
        },
      },
      response: {
        302: { type: 'null' },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.verifyEmail);

  // POST /auth/login
  fastify.post('/login', {
    schema: {
      tags: ['auth'],
      summary: 'Вход в систему',
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
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
        },
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.login);

  // GET /auth/me
  fastify.get('/me', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Получить данные текущего пользователя',
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
        401: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.getMe);

  // POST /auth/logout
  fastify.post('/logout', {
    schema: {
      tags: ['auth'],
      summary: 'Выход из системы',
      response: {
        200: {
          type: 'object',
          properties: {},
        },
      },
    },
  }, controller.logout);

  // POST /auth/change-password
  fastify.post('/change-password', {
    preHandler: [fastify.authenticate],
    schema: {
      tags: ['auth'],
      summary: 'Смена пароля',
      body: {
        type: 'object',
        required: ['oldPassword', 'newPassword'],
        properties: {
          oldPassword: { type: 'string' },
          newPassword: { type: 'string', minLength: 6 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {},
        },
        400: { type: 'object', properties: { error: { type: 'string' } } },
      },
    },
  }, controller.changePassword);

  fastify.post('/resend-verification', {
    schema: {
      body: { type: 'object', required: ['email'], properties: { email: { type: 'string', format: 'email' } } },
      response: { 200: { type: 'object', properties: { verificationUrl: { type: 'string' }, previewUrl: { type: 'string' } } } },
    },
  }, controller.resendVerification);
}