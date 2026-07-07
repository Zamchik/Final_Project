// Страница каталога товаров
import { useEffect, useState, useCallback } from 'react';
import { Card, Input, Select, InputNumber, Row, Col, Pagination, Spin, Empty, Typography, message } from 'antd';
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const { Meta } = Card;
const { Text } = Typography;

interface Product {
  id: number;
  title: string;
  price: string;
  rating: string;
  imageUrl: string | null;
  category: { id: number; name: string };
  createdAt: string;
}

const CatalogPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/products', {
        params: { page, limit: 12, search, categoryId, minPrice, maxPrice },
      });
      setProducts(data.products);
      setTotal(data.total);
    } catch {
      message.error('Не удалось загрузить товары');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    apiClient.get('/categories')
      .then(({ data }) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        message.error('Не удалось загрузить категории');
        setCategories([]);
      });
  }, []);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
      <h1>Каталог товаров</h1>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Input.Search
            placeholder="Поиск по названию"
            allowClear
            onSearch={(value) => { setSearch(value); setPage(1); }}
          />
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Select
            placeholder="Категория"
            allowClear
            style={{ width: '100%' }}
            value={categoryId}
            onChange={(val: number | undefined) => { setCategoryId(val); setPage(1); }}
            options={(Array.isArray(categories) ? categories : []).map(c => ({ value: c.id, label: c.name }))}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена от"
            min={0}
            style={{ width: '100%' }}
            value={minPrice}
            onChange={(val: number | null) => { setMinPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена до"
            min={0}
            style={{ width: '100%' }}
            value={maxPrice}
            onChange={(val: number | null) => { setMaxPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
      </Row>

      {loading ? (
        <Spin style={{ display: 'block', marginTop: 40 }} />
      ) : products.length === 0 ? (
        <Empty description="Товары не найдены" />
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {products.map(product => (
              <Col xs={24} sm={12} md={6} key={product.id}>
                <Link to={`/product/${product.id}`}>
                  <Card
                    hoverable
                    cover={
                      <div style={{
                        height: 140,
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <img
                          src={product.imageUrl || '/placeholder.png'}
                          alt={product.title}
                          style={{
                            maxHeight: '100%',
                            maxWidth: '100%',
                            objectFit: 'contain',
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      </div>
                    }
                  >
                    <Meta
                      title={product.title}
                      description={
                        <>
                          <Text strong style={{ fontSize: 16, color: '#fff' }}>
                            {product.price} ₽
                          </Text>
                          <br />
                          <Text type="secondary">{product.category.name}</Text>
                        </>
                      }
                    />
                  </Card>
                </Link>
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