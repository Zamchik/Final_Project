import { FastifyInstance } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { prisma } from '../prisma';

export default async function publicRoutes(fastify: FastifyInstance) {
    const productService = new ProductService();

    // GET /products — публичный каталог
    fastify.get('/', async (request, reply) => {
        const { page = 1, limit = 12, search, categoryId, minPrice, maxPrice, sort } = request.query as any;
        return productService.getPublicList({
            page: Number(page),
            limit: Number(limit),
            search,
            categoryId: categoryId ? Number(categoryId) : undefined,
            minPrice: minPrice ? Number(minPrice) : undefined,
            maxPrice: maxPrice ? Number(maxPrice) : undefined,
            sort: sort as any,
        });
    });

    // GET /products/:id — карточка товара (публичная)
    fastify.get('/:id', async (request, reply) => {
        const { id } = request.params as any;
        const product = await prisma.product.findUnique({
            where: { id: Number(id) },
            include: { category: true, keys: true }, //Нужно подумать, ключи не показываем до покупки? лучше показать только количество
        });
        if (!product || product.status !== 'active') {
            reply.status(404).send({ error: 'Товар не найден' });
            return;
        }
        // Возвращаем без ключей
        const { keys, ...rest } = product;
        return { ...rest, stock: product.keys.filter(k => !k.isSold).length }; // актуальный сток
    });
}