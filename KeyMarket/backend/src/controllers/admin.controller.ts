import { FastifyRequest } from 'fastify';
import { AdminService } from '../services/admin.service';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

// Список ролей, которым разрешён доступ к админ-панели
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export class AdminController {
    constructor(private adminService: AdminService) { }

    // GET /admin/users — список пользователей
    getUsers = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20, search } = req.query as any;
        return this.adminService.getUsers(Number(page), Number(limit), search);
    };

    // PUT /admin/users/:id/ban — забанить пользователя
    banUser = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { id } = req.params as any;
        return this.adminService.banUser(Number(id));
    };

    // PUT /admin/users/:id/unban — разбанить пользователя
    unbanUser = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { id } = req.params as any;
        return this.adminService.unbanUser(Number(id));
    };

    // PUT /admin/users/:id/role — изменить роль пользователя
    changeRole = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { id } = req.params as any;
        const { role } = req.body as any;
        const currentUser = req.session.get('user')!;
        return this.adminService.changeRole(Number(id), role.toUpperCase(), currentUser.role);
    };

    // GET /admin/products — список товаров
    getProducts = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20 } = req.query as any;
        return this.adminService.getProducts(Number(page), Number(limit));
    };

    // GET /admin/orders — список заказов
    getOrders = async (req: FastifyRequest) => {
        this.ensureAdmin(req);
        const { page = 1, limit = 20 } = req.query as any;
        return this.adminService.getOrders(Number(page), Number(limit));
    };

    // Проверяет, что запрос отправлен администратором или супер-администратором.
    // Бросает UnauthorizedError, если пользователь не авторизован,
    // и ForbiddenError, если у него недостаточно прав.
    private ensureAdmin(req: FastifyRequest) {
        const user = req.session.get('user');
        if (!user) throw new UnauthorizedError('Unauthorized');
        if (!ADMIN_ROLES.includes(user.role)) {
            throw new ForbiddenError('Access denied');
        }
    }
}