// Маршруты для загрузки изображений товаров
import { FastifyInstance } from 'fastify';
import { prisma } from '../prisma';
import { requireRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export default async function uploadRoutes(fastify: FastifyInstance) {
  // POST /upload/product-image — загрузить изображение для товара
  fastify.post('/product-image', {
    preHandler: [fastify.authenticate, requireRole('seller')],
  }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ error: 'Файл не найден' });
    }

    // Проверяем тип файла (только изображения)
    const mimeType = data.mimetype;
    if (!mimeType.startsWith('image/')) {
      return reply.status(400).send({ error: 'Разрешены только изображения' });
    }

    // Создаём папку для загрузок, если её нет
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const ext = path.extname(data.filename);
    const newFileName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, newFileName);

    // Сохраняем файл
    const writeStream = fs.createWriteStream(filePath);
    await data.file.pipe(writeStream);

    // Возвращаем URL для доступа к файлу
    const imageUrl = `/uploads/${newFileName}`;
    return { imageUrl };
  });

  // Статическая раздача файлов из папки uploads
  fastify.register(import('@fastify/static'), {
    root: path.join(__dirname, '../../uploads'),
    prefix: '/uploads/',
  });
}