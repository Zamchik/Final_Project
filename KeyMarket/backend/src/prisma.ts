import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL || 'postgresql://keymarket:keymarket123@localhost:5432/keymarket',
});