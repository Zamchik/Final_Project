import { ProductService } from '../services/product/product.service';
import { prisma } from '../prisma';

describe('ProductService', () => {
  let productService: ProductService;

  beforeAll(() => {
    productService = new ProductService();
  });

  it('должен создать товар с пустым списком ключей (stock = 0)', async () => {
    const product = await productService.createProduct(1, {
      title: 'Test Product',
      price: 100,
      categoryId: 1,
      keys: [],
    });
    expect(product).toHaveProperty('id');
    expect(product.stock).toBe(0);
  });

  it('должен получить список товаров продавца (пустой)', async () => {
    const result = await productService.getMyProducts(99999, 1, 10);
    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
  });
});