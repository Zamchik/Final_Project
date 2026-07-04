import { PrismaClient } from '@prisma/client';

export class CategoryService {
  constructor(private prisma: PrismaClient) {}

  async getAll() {
    return this.prisma.category.findMany();
  }

  async getById(id: number) {
    return this.prisma.category.findUnique({ where: { id } });
  }

  async create(name: string, slug: string) {
    return this.prisma.category.create({
      data: { name, slug },
    });
  }
}