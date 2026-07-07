// Контроллер товаров
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { UnauthorizedError, NotFoundError } from '../common/errors';

export class ProductController {
  constructor(private productService: ProductService) { }

  // GET /products/my — получить список товаров продавца
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

  // POST /products/my — создать новый товар
  createProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');
    const body = req.body as any;
    const product = await this.productService.createProduct(user.id, body);
    reply.status(201).send(product);
  };

  // PUT /products/my/:id — обновить товар
  updateProduct = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const body = req.body as any;
    return this.productService.updateProduct(Number(id), user.id, body);
  };
  
  // DELETE /products/my/:id — удалить товар
  deleteProduct = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    return this.productService.deleteProduct(Number(id), user.id);
  };

  // GET /products/my/:id — получить товар для редактирования
  getProductForEdit = async (req: FastifyRequest) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');
    const { id } = req.params as any;
    const product = await this.productService.getProductForEdit(Number(id), user.id);
    if (!product) throw new NotFoundError('Товар не найден или нет доступа');
    return product;
  };
}