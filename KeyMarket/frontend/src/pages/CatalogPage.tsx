// Страница каталога товаров
import { useEffect, useState, useCallback } from 'react';
import { Card, Input, Select, InputNumber, Row, Col, Pagination, Spin, Empty, Typography, Rate } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
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
    } catch (err) {
      console.error('Ошибка загрузки каталога', err);
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryId, minPrice, maxPrice]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Загружаем категории
  useEffect(() => {
    apiClient.get('/categories')
      .then(({ data }) => {
        setCategories(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        setCategories([]);
      });
  }, []);

  return (
    <div style={{ padding: '0 20px' }}>
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
              <Col xs={24} sm={12} md={8} lg={6} key={product.id}>
                <Link to={`/product/${product.id}`}>
                  <Card
                    hoverable
                    cover={
                      product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.title}
                          style={{ height: 160, width: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div
                          style={{
                            height: 160,
                            background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <KeyOutlined style={{ fontSize: 48, color: '#722ed1' }} />
                        </div>
                      )
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
                          <br />
                          <Rate
                            value={Number(product.rating)}
                            disabled
                            allowHalf
                            style={{ fontSize: 14 }}
                          />
                          <Text type="secondary" style={{ fontSize: 12, marginLeft: 4 }}>
                            {product.rating ? Number(product.rating).toFixed(1) : ''}
                          </Text>
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