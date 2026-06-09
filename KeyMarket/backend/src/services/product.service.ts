import { prisma } from '../prisma';

export class ProductService {
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

  async createProduct(sellerId: number, data: { title: string; description?: string; price: number; categoryId: number; keys: string[] }) {
    const product = await prisma.product.create({
      data: {
        sellerId,
        title: data.title,
        description: data.description || '',
        price: data.price,
        categoryId: data.categoryId,
        stock: data.keys.length,
        keys: { create: data.keys.map(key => ({ keyValue: key })) },
      },
      include: { category: true, keys: true },
    });
    return product;
  }

  async updateProduct(productId: number, sellerId: number, data: { title?: string; description?: string; price?: number; categoryId?: number; status?: string; newKeys?: string[] }) {
    const product = await prisma.product.findFirst({ where: { id: productId, sellerId } });
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
      ops.push(prisma.product.update({ where: { id: productId }, data: updateData }));
    }

    if (data.newKeys?.length) {
      ops.push(prisma.productKey.createMany({
        data: data.newKeys.map(key => ({ productId, keyValue: key })),
      }));
      ops.push(prisma.product.update({ where: { id: productId }, data: { stock: { increment: data.newKeys.length } } }));
    }

    if (ops.length) await prisma.$transaction(ops);
    return prisma.product.findUnique({ where: { id: productId }, include: { category: true, keys: true } });
  }

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