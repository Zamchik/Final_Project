// Сервис управления товарами
// Содержит бизнес-логику для CRUD операций с товарами и ключами
import { prisma } from '../prisma';

export class ProductService {
  // Получить список товаров продавца с пагинацией и поиском.
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

  // Создать новый товар вместе с ключами.
  async createProduct(
    sellerId: number,
    data: {
      title: string;
      description?: string;
      price: number;
      categoryId: number;
      keys: string[];
      imageUrl?: string;
    }
  ) {
    const uniqueKeys = [...new Set(data.keys)];
    if (uniqueKeys.length !== data.keys.length) {
      throw new Error('Ключи не должны повторяться в рамках одного товара');
    }

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

    const product = await prisma.$transaction(async (tx) => {
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
          imageUrl: data.imageUrl || null,
          keys: {
            create: uniqueKeys.map((key) => ({ keyValue: key })),
          },
        },
        include: { category: true, keys: true },
      });
    });

    return product;
  }

  // Обновить товар: изменить поля и/или добавить новые ключи.
  async updateProduct(
  productId: number,
  sellerId: number,
  data: {
    title?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    status?: string;
    imageUrl?: string;
    newKeys?: string[];
  }
) {
  const product = await prisma.product.findFirst({
    where: { id: productId, sellerId },
  });
  if (!product) throw new Error('Товар не найден или нет доступа');

  const ops: any[] = [];
  const updateData: any = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.price !== undefined) updateData.price = data.price;
  if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

  // Если есть новые ключи — добавляем их создание и готовим инкремент stock
  if (data.newKeys && data.newKeys.length > 0) {
    const uniqueNewKeys = [...new Set(data.newKeys)];
    if (uniqueNewKeys.length !== data.newKeys.length) {
      throw new Error('Новые ключи не должны повторяться');
    }

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

    // Добавляем создание ключей в ops
    ops.push(
      prisma.productKey.createMany({
        data: uniqueNewKeys.map((key) => ({ productId, keyValue: key })),
      })
    );

    // Инкремент stock добавляем в тот же объект updateData
    updateData.stock = { increment: uniqueNewKeys.length };
  }

  // Один-единственный update для товара, если есть что менять
  if (Object.keys(updateData).length > 0) {
    ops.push(
      prisma.product.update({
        where: { id: productId },
        data: updateData,
      })
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

  // Удалить товар и все связанные с ним ключи.
  async deleteProduct(productId: number, sellerId: number) {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) throw new Error('Товар не найден или нет доступа');

    await prisma.$transaction([
      prisma.productKey.deleteMany({ where: { productId } }),
      prisma.product.delete({ where: { id: productId } }),
    ]);

    return { success: true };
  }
}