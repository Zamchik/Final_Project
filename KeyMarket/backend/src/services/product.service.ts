// Сервис управления товарами
// Содержит бизнес-логику для CRUD операций с товарами и ключами
import { prisma } from '../prisma';

export class ProductService {
  /**
   * Получить список товаров продавца с пагинацией и поиском.
   * @param sellerId - ID продавца
   * @param page - текущая страница
   * @param limit - количество товаров на странице
   * @param search - строка поиска по названию (опционально)
   * @param categoryId - фильтр по категории (опционально)
   */
  async getMyProducts(sellerId: number, page: number, limit: number, search?: string, categoryId?: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { sellerId };
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (categoryId) where.categoryId = categoryId;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, keys: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total, page, limit };
  }

  /**
   * Создать новый товар вместе с ключами.
   * Выполняет проверку уникальности ключей внутри запроса и глобально в базе.
   * @param sellerId - ID продавца
   * @param data - данные товара и массив ключей
   */
  async createProduct(
    sellerId: number,
    data: {
      title: string;
      description?: string;
      price: number;
      categoryId: number;
      keys: string[];
    }
  ) {
    // Убираем дубликаты внутри переданного массива
    const uniqueKeys = [...new Set(data.keys)];
    if (uniqueKeys.length !== data.keys.length) {
      throw new Error('Ключи не должны повторяться в рамках одного товара');
    }

    // Проверяем глобальную уникальность: ищем ключи, которые уже есть в базе
    const existingKeys = await prisma.productKey.findMany({
      where: { keyValue: { in: uniqueKeys } },
      select: { keyValue: true },
    });
    if (existingKeys.length > 0) {
      throw new Error(
        `Следующие ключи уже существуют в системе: ${existingKeys
          .map((k) => k.keyValue)
          .join(', ')}`
      );
    }

    // Создаём товар с ключами в транзакции (на случай одновременных запросов)
    const product = await prisma.$transaction(async (tx) => {
      // Дополнительная проверка внутри транзакции (на случай параллельного добавления)
      const doubleCheck = await tx.productKey.findMany({
        where: { keyValue: { in: uniqueKeys } },
        select: { keyValue: true },
      });
      if (doubleCheck.length > 0) {
        throw new Error('Ключи были добавлены другим пользователем в процессе создания');
      }

      return tx.product.create({
        data: {
          sellerId,
          title: data.title,
          description: data.description || '',
          price: data.price,
          categoryId: data.categoryId,
          stock: uniqueKeys.length,
          keys: {
            create: uniqueKeys.map((key) => ({ keyValue: key })),
          },
        },
        include: { category: true, keys: true },
      });
    });

    return product;
  }

  /**
   * Обновить товар: изменить поля и/или добавить новые ключи.
   * Также проверяет уникальность новых ключей.
   * @param productId - ID товара
   * @param sellerId - ID продавца (для проверки владения)
   * @param data - поля для обновления и/или массив новых ключей
   */
  async updateProduct(
    productId: number,
    sellerId: number,
    data: {
      title?: string;
      description?: string;
      price?: number;
      categoryId?: number;
      status?: string;
      newKeys?: string[];
    }
  ) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) throw new Error('Товар не найден или нет доступа');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ops: any[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length > 0) {
      ops.push(
        prisma.product.update({ where: { id: productId }, data: updateData })
      );
    }

    if (data.newKeys && data.newKeys.length > 0) {
      // Убираем дубликаты внутри переданного массива
      const uniqueNewKeys = [...new Set(data.newKeys)];
      if (uniqueNewKeys.length !== data.newKeys.length) {
        throw new Error('Новые ключи не должны повторяться');
      }

      // Глобальная проверка уникальности
      const existingKeys = await prisma.productKey.findMany({
        where: { keyValue: { in: uniqueNewKeys } },
        select: { keyValue: true },
      });
      if (existingKeys.length > 0) {
        throw new Error(
          `Ключи уже существуют в системе: ${existingKeys
            .map((k) => k.keyValue)
            .join(', ')}`
        );
      }

      // Выполняем вставку ключей и увеличение стока в транзакции
      ops.push(
        prisma.$transaction([
          prisma.productKey.createMany({
            data: uniqueNewKeys.map((key) => ({ productId, keyValue: key })),
          }),
          prisma.product.update({
            where: { id: productId },
            data: { stock: { increment: uniqueNewKeys.length } },
          }),
        ])
      );
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops);
    }

    return prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, keys: true },
    });
  }

  /**
   * Удалить товар и все связанные с ним ключи.
   * @param productId - ID товара
   * @param sellerId - ID продавца (для проверки владения)
   */
  async deleteProduct(productId: number, sellerId: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) throw new Error('Товар не найден или нет доступа');

    // Транзакция: сначала удаляем все ключи товара, потом сам товар
    await prisma.$transaction([
      prisma.productKey.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return { success: true };
  }
}