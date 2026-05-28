import bcrypt from 'bcrypt';
import { prisma } from '../prisma';

export class AuthService {
  async register(email: string, password: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');
    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password_hash, role: 'buyer' },
    });
    return { id: user.id, email: user.email, role: user.role };
  }

  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid email or password');
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');
    return { id: user.id, email: user.email, role: user.role };
  }

  async getUserById(id: number) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');
    return { id: user.id, email: user.email, role: user.role, balance: user.balance };
  }
}