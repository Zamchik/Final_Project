// Сервис администратора
import { PrismaClient, UserRole } from '@prisma/client';
import { NotFoundError, BadRequestError } from '../common/errors';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async getUsers(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          bannedAt: true,
          createdAt: true,
          balance: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

  async banUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date() },
    });
    return { success: true };
  }

  async unbanUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: null },
    });
    return { success: true };
  }

  async changeRole(userId: number, role: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestError('Недопустимая роль');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return { success: true };
  }

  // Просмотр товаров и заказов для админа можно оставить без изменений
  async getProducts(page: number, limit: number) {
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        include: { category: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count(),
    ]);
    return { products, total, page, limit };
  }

  async getOrders(page: number, limit: number) {
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        include: { buyer: { select: { email: true } }, items: { include: { product: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, limit };
  }
}