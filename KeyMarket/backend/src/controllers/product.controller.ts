// Контроллер товаров
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { UnauthorizedError } from '../common/errors';

export class ProductController {
  constructor(private productService: ProductService) { }

  // GET /products/my – список товаров продавца.
  // Параметры query: page, limit, search, categoryId – извлекаются через as any.
  getMyProducts = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, search, categoryId } = req.query as any;
    return this.productService.getMyProducts(
      user.id,
      Number(page),
      Number(limit),
      search,
      categoryId ? Number(categoryId) : undefined
    );
  };

  // POST /products – создать товар.
  // Тело запроса ожидается в любом виде, совместимом с createProduct.
  createProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const body = req.body as any;
    const product = await this.productService.createProduct(user.id, body);
    reply.status(201).send(product);
  };

  // PUT /products/:id – обновить товар.
  updateProduct = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { id } = req.params as any;
    const body = req.body as any;
    return this.productService.updateProduct(Number(id), user.id, body);
  };

  // DELETE /products/:id – удалить товар.
  deleteProduct = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { id } = req.params as any;
    return this.productService.deleteProduct(Number(id), user.id);
  };
}