// Запросы к БД для товаров и ключей
import { prisma } from '../../prisma';
import { Prisma } from '@prisma/client';

// Поиск товаров продавца с пагинацией и фильтрацией.
export const findMyProducts = async (
  sellerId: number,
  page: number,
  limit: number,
  search?: string,
  categoryId?: number
) => {
  const where: Prisma.ProductWhereInput = { sellerId };
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
};

// Создание товара с ключами и, опционально, изображением и типом товара.
export const createProductWithKeys = async (
  sellerId: number,
  data: {
    title: string;
    description?: string;
    price: number;
    categoryId: number;
    keys: string[];
    imageUrl?: string | null;
    productType?: 'GAME' | 'DLC';
  }
) => {
  return prisma.product.create({
    data: {
      sellerId,
      title: data.title,
      description: data.description || '',
      price: data.price,
      categoryId: data.categoryId,
      imageUrl: data.imageUrl || null,
      productType: data.productType || 'GAME',
      stock: data.keys.length,
      keys: { create: data.keys.map((key) => ({ keyValue: key })) },
    },
    include: { category: true, keys: true },
  });
};

// Обновление полей товара.
// возвращает PrismaPromise, что необходимо для $transaction.
export const updateProductFields = (productId: number, data: Prisma.ProductUpdateInput) => {
  return prisma.product.update({ where: { id: productId }, data });
};

// Добавление новых ключей (createMany).
export const addProductKeys = (productId: number, keys: string[]) => {
  return prisma.productKey.createMany({
    data: keys.map((key) => ({ productId, keyValue: key })),
  });
};

// Увеличение стока товара.
export const incrementStock = (productId: number, amount: number) => {
  return prisma.product.update({
    where: { id: productId },
    data: { stock: { increment: amount } },
  });
};

// Поиск товара по ID с проверкой владельца.
export const findProductById = async (productId: number, sellerId: number) => {
  return prisma.product.findFirst({ where: { id: productId, sellerId } });
};

// Получить товар с категорией и ключами.
export const getProductWithDetails = async (productId: number) => {
  return prisma.product.findUnique({
    where: { id: productId },
    include: { category: true, keys: true },
  });
};

// Удаление товара и его ключей (в транзакции).
export const deleteProductWithKeys = async (productId: number) => {
  return prisma.$transaction([
    prisma.productKey.deleteMany({ where: { productId } }),
    prisma.product.delete({ where: { id: productId } }),
  ]);
};

// Поиск существующих ключей по значениям.
export const findExistingKeys = async (keys: string[]) => {
  return prisma.productKey.findMany({
    where: { keyValue: { in: keys } },
    select: { keyValue: true },
  });
};

// Публичный список товаров с фильтрацией и пагинацией.
export const findPublicProducts = async (options: {
  page: number;
  limit: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
  productType?: 'GAME' | 'DLC'
}) => {
  const where: Prisma.ProductWhereInput = { status: 'ACTIVE' };

  if (options.search) {
    where.title = { contains: options.search, mode: 'insensitive' };
  }
  if (options.categoryId) {
    where.categoryId = options.categoryId;
  }
  // Фильтр по типу товара, если передан
  if (options.productType) {
    where.productType = options.productType;
  }
  if (options.minPrice !== undefined || options.maxPrice !== undefined) {
    where.price = {};
    if (options.minPrice !== undefined) where.price.gte = options.minPrice;
    if (options.maxPrice !== undefined) where.price.lte = options.maxPrice;
  }

  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (options.sort === 'price_asc') orderBy = { price: 'asc' };
  else if (options.sort === 'price_desc') orderBy = { price: 'desc' };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        title: true,
        price: true,
        rating: true,
        imageUrl: true,
        productType: true,
        category: { select: { id: true, name: true } },
        createdAt: true,
        _count: {
          select: {
            keys: { where: { soldAt: { not: null } } },
          },
        },
      },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
      orderBy,
    }),
    prisma.product.count({ where }),
  ]);

  const productsWithSales = products.map(p => ({
    ...p,
    sales: p._count.keys,
  }));

  return { products: productsWithSales, total, page: options.page, limit: options.limit };
};