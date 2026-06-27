import { ProductService } from '../services/product/product.service';
import { prisma } from '../prisma';

describe('ProductService', () => {
  let productService: ProductService;

  beforeAll(() => {
    productService = new ProductService();
  });

  it('должен выбросить ошибку при создании товара без ключей', async () => {
    await expect(
      productService.createProduct(1, {
        title: 'Test Product',
        price: 100,
        categoryId: 1,
        keys: [],
      })
    ).rejects.toThrow('Добавьте хотя бы один ключ');
  });

  it('должен получить список товаров продавца (пустой)', async () => {
    const result = await productService.getMyProducts(99999, 1, 10);
    expect(result.products).toEqual([]);
    expect(result.total).toBe(0);
  });
});