import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { prisma } from '../prisma';

interface PublicQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'price_asc' | 'price_desc' | 'newest';
}

interface ProductParams {
  id: string;
}

export default async function publicRoutes(fastify: FastifyInstance) {
  const productService = new ProductService();

  // GET /products — публичный каталог
  fastify.get('/', async (request: FastifyRequest<{ Querystring: PublicQuery }>) => {
    const { page = 1, limit = 12, search, categoryId, minPrice, maxPrice, sort } = request.query;
    return productService.getPublicList({
      page: Number(page),
      limit: Number(limit),
      search,
      categoryId: categoryId ? Number(categoryId) : undefined,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      sort,
    });
  });

  // GET /products/:id — карточка товара (публичная)
  fastify.get('/:id', async (
    request: FastifyRequest<{ Params: ProductParams }>,
    reply: FastifyReply
  ) => {
    const productId = Number(request.params.id);
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { category: true, keys: true },
    });

    if (!product || product.status !== 'active') {
      return reply.status(404).send({ error: 'Товар не найден' });
    }

    // количество доступных ключей
    const { keys, ...rest } = product;
    return {
      ...rest,
      stock: keys.filter((k) => !k.isSold).length,
    };
  });
}