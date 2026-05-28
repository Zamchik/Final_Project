import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthService } from '../services/auth.service';

interface AuthBody {
  email: string;
  password: string;
}

interface JwtPayload {
  id: number;
  email: string;
  role: string;
}

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (
    req: FastifyRequest<{ Body: AuthBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.register(email, password);
      const token = await reply.jwtSign(user);
      return { token, user };
    } catch (err) {
      reply.status(400).send({ error: (err as Error).message });
    }
  };

  login = async (
    req: FastifyRequest<{ Body: AuthBody }>,
    reply: FastifyReply
  ) => {
    try {
      const { email, password } = req.body;
      const user = await this.authService.login(email, password);
      const token = await reply.jwtSign(user);
      return { token, user };
    } catch (err) {
      reply.status(401).send({ error: (err as Error).message });
    }
  };

  me = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const payload = (await req.jwtVerify()) as JwtPayload;
      const user = await this.authService.getUserById(payload.id);
      return user;
    } catch {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  };
}