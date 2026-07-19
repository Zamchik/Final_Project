// Тестирование AdminService: бан/разбан, смена роли, получение списков,
import { AdminService } from '../services/admin.service';
import { prisma } from '../prisma';

describe('AdminService', () => {
  let adminService: AdminService;
  const superAdminId = 1; // admin@keymarket.local
  const sellerId = 2;     // seller@keymarket.local
  const buyerId = 3;      // buyer@keymarket.local

  beforeAll(() => {
    adminService = new AdminService(prisma);
  });

  afterAll(async () => {
    // Восстанавливаем изначальное состояние: снимаем бан и возвращаем роли
    await prisma.user.update({ where: { id: sellerId }, data: { bannedAt: null, role: 'SELLER' } });
    await prisma.user.update({ where: { id: buyerId }, data: { bannedAt: null, role: 'BUYER' } });
  });

  // Получение списка пользователей
  it('должен вернуть список пользователей с пагинацией', async () => {
    const result = await adminService.getUsers(1, 10);
    expect(result).toHaveProperty('users');
    expect(result.users.length).toBeGreaterThan(0);
    expect(result).toHaveProperty('total');
    expect(result).toHaveProperty('page', 1);
    expect(result).toHaveProperty('limit', 10);
  });

  // Фильтр пользователей по роли
  it('должен фильтровать пользователей по роли', async () => {
    const result = await adminService.getUsers(1, 10, undefined, 'SELLER');
    expect(result.users.every(u => u.role === 'SELLER')).toBe(true);
  });

  // Бан пользователя
  it('должен забанить пользователя', async () => {
    const res = await adminService.banUser(sellerId);
    expect(res.success).toBe(true);
    const bannedUser = await prisma.user.findUnique({ where: { id: sellerId } });
    expect(bannedUser!.bannedAt).not.toBeNull();
  });

  // Разбан пользователя
  it('должен разбанить пользователя', async () => {
    await adminService.banUser(sellerId); // сначала баним
    const res = await adminService.unbanUser(sellerId);
    expect(res.success).toBe(true);
    const unbanned = await prisma.user.findUnique({ where: { id: sellerId } });
    expect(unbanned!.bannedAt).toBeNull();
  });

  // Попытка забанить SUPER_ADMIN
  it('не должен банить SUPER_ADMIN', async () => {
    await expect(adminService.banUser(superAdminId)).rejects.toThrow(
      'Нельзя забанить супер‑администратора'
    );
  });

  // Попытка разбанить SUPER_ADMIN
  it('не должен разбанить SUPER_ADMIN', async () => {
    await expect(adminService.unbanUser(superAdminId)).rejects.toThrow(
      'Нельзя разбанить супер‑администратора'
    );
  });

  // Смена роли обычному пользователю
  it('должен изменить роль пользователя', async () => {
    // Меняем buyer на seller
    const res = await adminService.changeRole(buyerId, 'SELLER', 'SUPER_ADMIN');
    expect(res.success).toBe(true);
    const updated = await prisma.user.findUnique({ where: { id: buyerId } });
    expect(updated!.role).toBe('SELLER');
    // Возвращаем обратно
    await adminService.changeRole(buyerId, 'BUYER', 'SUPER_ADMIN');
  });

  // Смена роли на недопустимую
  it('должен выбросить ошибку при недопустимой роли', async () => {
    await expect(
      adminService.changeRole(buyerId, 'INVALID' as any, 'SUPER_ADMIN')
    ).rejects.toThrow('Недопустимая роль');
  });

  // Попытка изменить роль SUPER_ADMIN
  it('не должен менять роль SUPER_ADMIN', async () => {
    await expect(
      adminService.changeRole(superAdminId, 'BUYER', 'SUPER_ADMIN')
    ).rejects.toThrow('Нельзя изменить роль супер‑администратора');
  });

  // Только SUPER_ADMIN может назначить SUPER_ADMIN
  it('только SUPER_ADMIN может назначить SUPER_ADMIN', async () => {
    // Имитируем вызов от имени ADMIN
    await expect(
      adminService.changeRole(sellerId, 'SUPER_ADMIN', 'ADMIN')
    ).rejects.toThrow('Только супер‑администратор может назначать эту роль');
  });

  // Получение списка товаров (админ)
  it('должен вернуть список товаров', async () => {
    const result = await adminService.getProducts(1, 10);
    expect(result).toHaveProperty('products');
    expect(result).toHaveProperty('total');
  });

  // Получение списка заказов (админ)
  it('должен вернуть список заказов', async () => {
    const result = await adminService.getOrders(1, 10);
    expect(result).toHaveProperty('orders');
    expect(result).toHaveProperty('total');
  });
});