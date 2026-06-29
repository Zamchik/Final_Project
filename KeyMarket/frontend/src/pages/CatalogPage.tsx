// Страница каталога товаров
// Отображает публичный список товаров с поиском, фильтрами и пагинацией.
// В будущем карточки будут содержать изображения от продавцов.
import { useEffect, useState, useCallback } from 'react';
import { Card, Input, Select, InputNumber, Row, Col, Pagination, Spin, Empty, Typography, Rate } from 'antd';
import { KeyOutlined } from '@ant-design/icons'; // иконка‑заглушка для обложки товара
import { Link } from 'react-router-dom';
import apiClient from '../api/client';

const { Meta } = Card;
const { Text } = Typography;

// Тип данных товара, приходящих с сервера для каталога
interface Product {
  id: number;
  title: string;
  price: string;
  rating: string;
  category: { id: number; name: string };
  createdAt: string;
}

const CatalogPage = () => {
  // Состояния для списка товаров и пагинации
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  // Фильтры
  const [search, setSearch] = useState('');                           // поисковая строка
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined); // выбранная категория
  const [minPrice, setMinPrice] = useState<number | undefined>(undefined);     // минимальная цена
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);     // максимальная цена

  // Список всех категорий (подтягивается с сервера)
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

  // Загрузка товаров с учётом текущих фильтров и страницы
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

  // Перезапрашиваем товары при изменении зависимостей
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Загружаем категории один раз при монтировании
  useEffect(() => {
    apiClient.get('/categories').then(({ data }) => setCategories(data)).catch(() => {});
  }, []);

  // Рендер
  return (
    <div style={{ padding: '0 20px' }}>
      <h1>Каталог товаров</h1>
      {/* Фильтры: поиск, категория, цена от/до                              */}
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
            options={categories.map(c => ({ value: c.id, label: c.name }))}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена от"
            min={0}
            style={{ width: '100%' }}
            value={minPrice}
            onChange={(val: number | undefined) => { setMinPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
        <Col xs={12} sm={6} md={3}>
          <InputNumber
            placeholder="Цена до"
            min={0}
            style={{ width: '100%' }}
            value={maxPrice}
            onChange={(val: number | undefined) => { setMaxPrice(val ?? undefined); setPage(1); }}
          />
        </Col>
      </Row>

      {/* Отображение: загрузка, пустота или список товаров                   */}
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
                      // Заглушка обложки — позже заменю на изображение от продавца
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
                    }
                  >
                    <Meta
                      title={product.title}
                      description={
                        <>
                          {/* Цена */}
                          <Text strong style={{ fontSize: 16, color: '#fff' }}>
                            {product.price} ₽
                          </Text>
                          <br />
                          {/* Категория */}
                          <Text type="secondary">{product.category.name}</Text>
                          <br />
                          {/* Рейтинг */}
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

          {/* Пагинация */}
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