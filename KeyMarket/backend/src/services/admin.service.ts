import { PrismaClient, UserRole } from '@prisma/client';
import { NotFoundError, BadRequestError, ForbiddenError } from '../common/errors';

export class AdminService {
  constructor(private prisma: PrismaClient) {}

  async getUsers(page: number, limit: number, search?: string, role?: string) {
    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (role) {
      where.role = role.toUpperCase();
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
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Нельзя забанить супер‑администратора');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: new Date() },
    });
    return { success: true };
  }

  async unbanUser(userId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Нельзя разбанить супер‑администратора');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { bannedAt: null },
    });
    return { success: true };
  }

  async changeRole(userId: number, role: UserRole, adminRole: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('Пользователь не найден');

    if (!Object.values(UserRole).includes(role)) {
      throw new BadRequestError('Недопустимая роль');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenError('Нельзя изменить роль супер‑администратора');
    }

    if (role === UserRole.SUPER_ADMIN && adminRole !== 'SUPER_ADMIN') {
      throw new ForbiddenError('Только супер‑администратор может назначать эту роль');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { role },
    });
    return { success: true };
  }

  async getProducts(page: number, limit: number, search?: string, status?: string) {
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (status) {
      where.status = status;
    }
    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: true,
          seller: { select: { email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where }),
    ]);
    return { products, total, page, limit };
  }

  async getOrders(page: number, limit: number, search?: string, status?: string) {
    const where: any = {};
    if (search) {
      where.buyer = { email: { contains: search, mode: 'insensitive' } };
    }
    if (status) {
      where.status = status;
    }
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          buyer: { select: { email: true } },
          items: { include: { product: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }
}