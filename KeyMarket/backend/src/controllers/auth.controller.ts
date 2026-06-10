import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

interface AuthBody {
  email: string;
  password: string;
}

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);
      // Сохраняем пользователя в сессии
      req.session.set('user', user);
      return { user };
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

  login = async (req: FastifyRequest<{ Body: AuthBody }>, reply: FastifyReply) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.login(email, password);
      // Сохраняем пользователя в сессии
      req.session.set('user', user);
      return { user };
    } catch (err) {
      reply.status(401).send({ error: (err as Error).message });
    }
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) {
      reply.status(401).send({ error: 'Unauthorized' });
      return;
    }
    const fullUser = await this.authService.getUserById(user.id);
    return fullUser;
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    req.session.delete();
    return { success: true };
  };
}