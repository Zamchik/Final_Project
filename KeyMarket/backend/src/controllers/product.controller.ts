// Контроллер товаров
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';
import { UnauthorizedError } from '../common/errors';

 // Контроллер для управления товарами (продавец).
 // Все методы требуют авторизации. 
export class ProductController {
  constructor(private productService: ProductService) {}

   // GET /products/my — список товаров текущего продавца.
  getMyProducts = async (req: FastifyRequest<{ Querystring: { page?: number; limit?: number; search?: string; categoryId?: number } }>) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const { page = 1, limit = 10, search, categoryId } = req.query;
    return this.productService.getMyProducts(
      user.id,
      Number(page),
      Number(limit),
      search,
      categoryId ? Number(categoryId) : undefined
    );
  };

   // POST /products — создать новый товар с ключами.
   // Тело запроса содержит поля, соответствующие ProductService.createProduct.
  createProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const body = req.body as any;   // временное приведение
    const product = await this.productService.createProduct(user.id, body);
    reply.status(201).send(product);
  };

  // PUT /products/:id — обновить товар (и/или добавить новые ключи).
  updateProduct = async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    const body = req.body as any;
    return this.productService.updateProduct(Number(req.params.id), user.id, body);
  };

   // DELETE /products/:id — удалить товар и все его ключи.
  deleteProduct = async (req: FastifyRequest<{ Params: { id: string } }>) => {
    const user = req.session.get('user');
    if (!user) throw new UnauthorizedError('Unauthorized');

    return this.productService.deleteProduct(Number(req.params.id), user.id);
  };
}