/* eslint-disable @typescript-eslint/no-explicit-any */
import { FastifyRequest, FastifyReply } from 'fastify';
import { ProductService } from '../services/product/product.service';

export class ProductController {
  constructor(private productService: ProductService) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getMyProducts = async (req: FastifyRequest, reply: FastifyReply) => {
    // пользователь берётся из сессии
    const user = req.session.get('user')!; // !!!! означает, что мы уверены в наличии (прошли authenticate)
    const { page = 1, limit = 10, search, categoryId } = req.query as any;
    const result = await this.productService.getMyProducts(
      user.id,
      Number(page),
      Number(limit),
      search,
      categoryId ? Number(categoryId) : undefined
    );
    return result;
  };

  createProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user')!;
    const body = req.body as any;
    try {
      const product = await this.productService.createProduct(user.id, body);
      reply.status(201).send(product);
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  };

  updateProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user')!;
    const { id } = req.params as any;
    const body = req.body as any;
    try {
      const product = await this.productService.updateProduct(
        Number(id),
        user.id,
        body
      );
      return product;
    } catch (err: any) {
       console.log('updateProduct error:', err.message);
      reply.status(400).send({ error: err.message });
    }
  };

  deleteProduct = async (req: FastifyRequest, reply: FastifyReply) => {
    const user = req.session.get('user')!;
    const { id } = req.params as any;
    try {
      return this.productService.deleteProduct(Number(id), user.id);
    } catch (err: any) {
      reply.status(400).send({ error: err.message });
    }
  };
}