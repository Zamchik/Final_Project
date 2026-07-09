// Страница каталога товаров
import { useEffect, useState, useCallback } from 'react';
import { Select, InputNumber, Row, Col, Pagination, Spin, Empty, message, Segmented } from 'antd';
import ProductCard from '../components/ProductCard';
import apiClient from '../api/client';

interface Product {
  id: number;
  title: string;
  price: string;
  rating: string;
  imageUrl: string | null;
  productType: string;
  category: { id: number; name: string };
  createdAt: string;
  sales: number;
}

const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);
  const [productType, setProductType] = useState<string | undefined>(undefined);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/products', {
        params: { page, limit: 12, categoryId, minPrice, maxPrice, productType },
      });
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      message.error('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, [page, categoryId, minPrice, maxPrice, productType]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    apiClient.get('/categories')
      .then(({ data }) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => message.error('Не удалось загрузить категории'));
  }, []);

  return (
    <div>
      <h1>Каталог товаров</h1>

      {/* Фильтры */}
      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Категория"
            allowClear
            style={{ width: '100%' }}
            value={categoryId}
            onChange={(val) => { setCategoryId(val); setPage(1); }}
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена от"
            min={0}
            style={{ width: '100%' }}
            value={minPrice}
            onChange={(val) => { setMinPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена до"
            min={0}
            style={{ width: '100%' }}
            value={maxPrice}
            onChange={(val) => { setMaxPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Segmented
            options={[
              { value: '', label: 'Все' },
              { value: 'GAME', label: 'Игры' },
              { value: 'DLC', label: 'DLC' },
            ]}
            value={productType || ''}
            onChange={(val) => {
              setProductType(val === '' ? undefined : val as string);
              setPage(1);
            }}
          />
        </Col>
      </Row>

      {/* Список товаров */}
      {loading ? (
        <Spin style={{ display: 'block', marginTop: 40 }} />
      ) : products.length === 0 ? (
        <Empty description="Товары не найдены" />
      ) : (
        <>
          <Row gutter={[24, 24]}>
            {products.map(product => (
              <Col xs={12} sm={12} md={8} lg={8} xl={6} xxl={4} key={product.id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <Pagination
              current={page}
              total={total}
              pageSize={12}
              onChange={(p) => setPage(p)}
              showTotal={(t) => `Всего ${t} товаров`}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default CatalogPage;