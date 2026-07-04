// Сервис управления товарами (фасад)
import { prisma } from '../../prisma';
import * as queries from './product.queries';
import * as validators from './product.validators';
import { ProductStatus } from '@prisma/client';
import { NotFoundError } from '../../common/errors';

export class ProductService {
  async getMyProducts(sellerId: number, page: number, limit: number, search?: string, categoryId?: number) {
    return queries.findMyProducts(sellerId, page, limit, search, categoryId);
  }

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

  async deleteProduct(productId: number, sellerId: number) {
    const product = await queries.findProductById(productId, sellerId);
    if (!product) throw new NotFoundError('Товар не найден или нет доступа');
    await queries.deleteProductWithKeys(productId);
    return { success: true };
  }

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