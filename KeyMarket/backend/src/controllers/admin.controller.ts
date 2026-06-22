// Контроллер для административных действий
import { FastifyRequest } from 'fastify';
import { AdminService } from '../services/admin.service';

export class AdminController {
    constructor(private adminService: AdminService) { }

    // GET /admin/users — список пользователей. 
    getUsers = async (req: FastifyRequest) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { page = 1, limit = 20, search, role } = req.query as any;
        return this.adminService.getUsers(Number(page), Number(limit), search, role);
    };

    // PUT /admin/users/:id/ban — бан / разбан.
    toggleBan = async (req: FastifyRequest<{ Params: { id: string } }>) => {
        const result = await this.adminService.toggleBan(Number(req.params.id));
        return result;
    };

    // PUT /admin/users/:id/role — смена роли.
    changeRole = async (req: FastifyRequest<{ Params: { id: string }; Body: { role: string } }>) => {
        const result = await this.adminService.changeRole(Number(req.params.id), req.body.role);
        return result;
    };

    // GET /admin/products — список всех товаров.
    getProducts = async (req: FastifyRequest) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { page = 1, limit = 20, search, status } = req.query as any;
        return this.adminService.getProducts(Number(page), Number(limit), search, status);
    };

    // GET /admin/orders — список всех заказов.
    getOrders = async (req: FastifyRequest) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { page = 1, limit = 20, search, status } = req.query as any;
        return this.adminService.getOrders(Number(page), Number(limit), search, status);
    };
}