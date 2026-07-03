// Сервис управления товарами (фасад)
import { prisma } from '../../prisma';
import * as queries from './product.queries';
import * as validators from './product.validators';

export class ProductService {
  // Получить список товаров продавца с пагинацией и поиском.
  async getMyProducts(sellerId: number, page: number, limit: number, search?: string, categoryId?: number) {
    return queries.findMyProducts(sellerId, page, limit, search, categoryId);
  }

  // Создать товар с ключами и, опционально, изображением.
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

  // Обновить товар и/или добавить новые ключи.
  async updateProduct(
    productId: number,
    sellerId: number,
    data: {
      title?: string;
      description?: string;
      price?: number;
      categoryId?: number;
      status?: string;
      imageUrl?: string | null;
      newKeys?: string[];
    }
  ) {
    const product = await queries.findProductById(productId, sellerId);
    if (!product) throw new Error('Товар не найден или нет доступа');

    // Массив для сбора операций, которые будут выполнены в одной транзакции
    const ops: unknown[] = [];

    // Собираем объект с обновляемыми полями
    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.categoryId !== undefined) updateData.categoryId = data.categoryId;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;

    // Если есть что обновлять – добавляем операцию
    if (Object.keys(updateData).length > 0) {
      ops.push(queries.updateProductFields(productId, updateData as any));
    }

    // Если переданы новые ключи – добавляем две операции (НЕ оборачиваем их в транзакцию!)
    if (data.newKeys?.length) {
      const uniqueNewKeys = validators.ensureNoDuplicates(data.newKeys);
      await validators.ensureGlobalUniqueness(uniqueNewKeys);

      // Просто кладём два промиса в ops – без вложенного $transaction
      ops.push(
        queries.addProductKeys(productId, uniqueNewKeys),
        queries.incrementStock(productId, uniqueNewKeys.length)
      );
    }

    // Выполняем все накопленные операции как одну транзакцию
    if (ops.length > 0) {
      console.log('updateProduct ops count:', ops.length);
      ops.forEach((op, i) => console.log(`  op[${i}] type:`, typeof op, op?.constructor?.name));
      await prisma.$transaction(ops as any);
    }

    // Возвращаем обновлённый товар со всеми связями
    return queries.getProductWithDetails(productId);
  }

  // Удалить товар и все его ключи.
  async deleteProduct(productId: number, sellerId: number) {
    const product = await queries.findProductById(productId, sellerId);
    if (!product) throw new Error('Товар не найден или нет доступа');
    await queries.deleteProductWithKeys(productId);
    return { success: true };
  }

  // Получить публичный список товаров (каталог).
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