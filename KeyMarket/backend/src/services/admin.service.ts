// Сервис для административных действий
import { prisma } from '../prisma';

export class AdminService {
    
   // Получить список пользователей с пагинацией и поиском.
  async getUsers(page: number, limit: number, search?: string, role?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    if (role) {
      where.role = role;
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          balance: true,
          is_banned: true,
          created_at: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);
    return { users, total, page, limit };
  }

   // Забанить или разбанить пользователя.
  async toggleBan(userId: number) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('Пользователь не найден');
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { is_banned: !user.is_banned },
      select: { id: true, email: true, is_banned: true },
    });
    return updated;
  }

   // Изменить роль пользователя (admin, seller, buyer).
  async changeRole(userId: number, role: string) {
    if (!['admin', 'seller', 'buyer'].includes(role)) {
      throw new Error('Недопустимая роль');
    }
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    return updated;
  }

   // Получить список всех товаров (с пагинацией, поиском, фильтром по статусу).
  async getProducts(page: number, limit: number, search?: string, status?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) where.title = { contains: search, mode: 'insensitive' };
    if (status) where.status = status;

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, seller: { select: { id: true, email: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);
    return { products, total, page, limit };
  }

   // Получить список всех заказов (с пагинацией, поиском по покупателю).
  async getOrders(page: number, limit: number, search?: string, status?: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.buyer = { email: { contains: search, mode: 'insensitive' } };
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          buyer: { select: { id: true, email: true } },
          items: { include: { product: true, productKey: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);
    return { orders, total, page, limit };
  }
}