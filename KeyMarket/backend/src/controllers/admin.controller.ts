import { FastifyRequest } from 'fastify';
import { AdminService } from '../services/admin.service';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

// Контроллер административной панели.
// Все методы требуют прав администратора, проверка выполняется через ensureAdmin.
export class AdminController {
    constructor(private adminService: AdminService) { }

    // GET /admin/users — список пользователей с пагинацией и поиском.
    getUsers = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; search?: string } }>) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20, search } = req.query;
        return this.adminService.getUsers(Number(page), Number(limit), search);
    };

    // POST /admin/users/:id/ban — забанить пользователя (устанавливает bannedAt).
    banUser = async (req: FastifyRequest<{ Params: { id: string } }>) => {
        this.ensureAdmin(req);
        return this.adminService.banUser(Number(req.params.id));
    };

    // POST /admin/users/:id/unban — разбанить пользователя (сбрасывает bannedAt).
    unbanUser = async (req: FastifyRequest<{ Params: { id: string } }>) => {
        this.ensureAdmin(req);
        return this.adminService.unbanUser(Number(req.params.id));
    };

    // PUT /admin/users/:id/role — изменить роль пользователя.
    // Ожидает тело { role: 'BUYER' | 'SELLER' | 'ADMIN' }.
    changeRole = async (req: FastifyRequest<{ Params: { id: string }; Body: { role: string } }>) => {
        this.ensureAdmin(req);
        return this.adminService.changeRole(Number(req.params.id), req.body.role);
    };

    // GET /admin/products — просмотр всех товаров.
    getProducts = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20 } = req.query;
        return this.adminService.getProducts(Number(page), Number(limit));
    };

    // GET /admin/orders — просмотр всех заказов.
    getOrders = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number } }>) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20 } = req.query;
        return this.adminService.getOrders(Number(page), Number(limit));
    };

    // Вспомогательный метод: проверяет, что запрос отправлен администратором.
    // Бросает UnauthorizedError или ForbiddenError в случае неудачи.
    private ensureAdmin(req: FastifyRequest) {
        const user = req.session.get('user');
        if (!user) throw new UnauthorizedError('Unauthorized');
        if (user.role !== 'ADMIN') throw new ForbiddenError('Access denied');
    }
}