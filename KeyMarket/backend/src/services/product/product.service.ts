// Сервис управления товарами (фасад)
import { prisma } from '../../prisma';
import * as queries from './product.queries';
import * as validators from './product.validators';
import { ProductStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors';

export class ProductService {
  // Получить список товаров продавца
  async getMyProducts(sellerId: number, page: number, limit: number, search?: string, categoryId?: number) {
    return queries.findMyProducts(sellerId, page, limit, search, categoryId);
  }

  // Создать товар с ключами
  async createProduct(
    sellerId: number,
    data: {
      title: string;
      description?: string;
      price: number;
      categoryId: number;
      keys: string[];
      imageUrl?: string | null;
    }
  ) {
    const uniqueKeys = validators.ensureNoDuplicates(data.keys);
    await validators.ensureGlobalUniqueness(uniqueKeys);
    return queries.createProductWithKeys(sellerId, {
      ...data,
      keys: uniqueKeys,
      imageUrl: data.imageUrl || null,
    });
  }

  // Обновить товар и/или добавить новые ключи
  async updateProduct(
    productId: number,
    sellerId: number,
    data: {
      title?: string;
      description?: string;
      price?: number;
      categoryId?: number;
      status?: ProductStatus;
      imageUrl?: string | null;
      newKeys?: string[];
    }
  ) {
    const product = await queries.findProductById(productId, sellerId);
    if (!product) throw new NotFoundError('Товар не найден или нет доступа');

    const ops: unknown[] = [];
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    if (Object.keys(updateData).length > 0) {
      ops.push(queries.updateProductFields(productId, updateData as any));
    }

    if (data.newKeys?.length) {
      const uniqueNewKeys = validators.ensureNoDuplicates(data.newKeys);
      await validators.ensureGlobalUniqueness(uniqueNewKeys);
      ops.push(
        queries.addProductKeys(productId, uniqueNewKeys),
        queries.incrementStock(productId, uniqueNewKeys.length)
      );
    }

    if (ops.length > 0) {
      await prisma.$transaction(ops as any);
    }

    return queries.getProductWithDetails(productId);
  }

  // Удалить товар
  async deleteProduct(productId: number, sellerId: number) {
    const product = await queries.findProductById(productId, sellerId);
    if (!product) throw new NotFoundError('Товар не найден или нет доступа');
    await queries.deleteProductWithKeys(productId);
    return { success: true };
  }

  // Получить публичный товар по ID (для страницы товара).
  // Возвращает товар без проданных ключей, с количеством доступных (stock).
  async getProductById(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true, keys: true },
    });

    if (!product || product.status !== ProductStatus.ACTIVE) {
      return null;
    }

    const { keys, ...rest } = product;
    return {
      ...rest,
      stock: keys.filter(k => !k.soldAt).length,
    };
  }

  // Получить товар для редактирования (продавец).
  async getProductForEdit(productId: number, sellerId: number) {
    return prisma.product.findFirst({
      where: { id: productId, sellerId },
      include: { category: true, keys: true },
    });
  }

  // Публичный список товаров (каталог)
  async getPublicList(options: {
    page: number;
    limit: number;
    search?: string;
    categoryId?: number;
    minPrice?: number;
    maxPrice?: number;
    sort?: 'price_asc' | 'price_desc' | 'newest';
  }) {
    return queries.findPublicProducts(options);
  }
}