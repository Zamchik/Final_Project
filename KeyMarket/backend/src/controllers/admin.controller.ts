import { FastifyRequest } from 'fastify';
import { AdminService } from '../services/admin.service';
import { UnauthorizedError, ForbiddenError } from '../common/errors';

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];

export class AdminController {
  constructor(private adminService: AdminService) {}

  getUsers = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { page = 1, limit = 20, search, role } = req.query as any;
    return this.adminService.getUsers(Number(page), Number(limit), search, role);
  };

  banUser = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { id } = req.params as any;
    return this.adminService.banUser(Number(id));
  };

  unbanUser = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { id } = req.params as any;
    return this.adminService.unbanUser(Number(id));
  };

  changeRole = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { id } = req.params as any;
    const { role } = req.body as any;
    const currentUser = req.session.get('user')!;
    return this.adminService.changeRole(Number(id), role.toUpperCase(), currentUser.role);
  };

  getProducts = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { page = 1, limit = 20, search, status } = req.query as any;
    return this.adminService.getProducts(Number(page), Number(limit), search, status);
  };

  getOrders = async (req: FastifyRequest) => {
    this.ensureAdmin(req);
    const { page = 1, limit = 20, search, status } = req.query as any;
    return this.adminService.getOrders(Number(page), Number(limit), search, status);
  };

  private ensureAdmin(req: FastifyRequest) {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');
    if (!ADMIN_ROLES.includes(user.role)) {
      throw new ForbiddenError('Access denied');
    }
  }
}