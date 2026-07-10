// Маршруты для загрузки изображений товаров
import { FastifyInstance } from 'fastify';
import { requireRole } from '../middleware/auth';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import sharp from 'sharp';

export default async function uploadRoutes(fastify: FastifyInstance) {
  fastify.post('/product-image', {
    preHandler: [fastify.authenticate, requireRole('SELLER')],
    schema: {
      tags: ['upload'],
      summary: 'Загрузить изображение товара с обрезкой до 4:3',
      description:
        'Принимает файл в multipart/form-data.\n\n' +
        'Пример curl:\n\n' +
        '```\n' +
        'curl -X POST "http://localhost:3000/upload/product-image" \\\n' +
        '  -H "accept: application/json" \\\n' +
        '  -H "Cookie: session=ВАША_КУКА" \\\n' +
        '  -F "file=@путь_к_файлу.jpg"\n' +
        '```\n',
      consumes: ['multipart/form-data'],
      response: {
        200: {
          type: 'object',
          properties: {
            imageUrl: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
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

    // Создаём папку для загрузок относительно рабочей директории (на Render это /opt/render/project/src/KeyMarket/backend/uploads)
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Генерируем уникальное имя файла
    const ext = path.extname(data.filename);
    const newFileName = `${randomUUID()}${ext}`;
    const filePath = path.join(uploadDir, newFileName);

    // Читаем буфер файла
    const chunks: Buffer[] = [];
    for await (const chunk of data.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // Обрезаем изображение до пропорции 4:3 с помощью sharp
    try {
      await sharp(buffer)
        .resize({
          width: 800,
          height: 600,
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 90 })
        .toFile(filePath);
    } catch (err) {
      return reply.status(400).send({ error: 'Ошибка обработки изображения' });
    }

    // Возвращаем URL для доступа к файлу
    const imageUrl = `/uploads/${newFileName}`;
    return { imageUrl };
  });
}