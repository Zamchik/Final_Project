// Страница карточки товара (публичная)
// Отображает детальную информацию о товаре и кнопку "Купить".

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Result, Typography, message } from 'antd';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

const { Title } = Typography;

// Тип для данных товара с бэкенда (без ключей)
interface ProductDetails {
  id: number;
  title: string;
  description: string;
  price: string;
  rating: string;
  stock: number;
  category: { id: number; name: string };
  status: string;
}

// Компонент ProductPage

const ProductPage = () => {
  // Параметры URL
  const { id } = useParams(); // ID товара из URL /product/:id

  // Навигация
  const navigate = useNavigate();

  // Сессия пользователя
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading); // проверка сессии при загрузке приложения

  // Локальное состояние
  const [product, setProduct] = useState<ProductDetails | null>(null); // данные товара
  const [fetching, setFetching] = useState(true);                     // загрузка данных товара
  const [error, setError] = useState(false);                          // флаг ошибки загрузки

  // Загрузка товара по ID

  useEffect(() => {
    const fetchProduct = async () => {
      setFetching(true);
      try {
        // Публичный эндпоинт карточки товара
        const { data } = await apiClient.get(`/products/${id}`);
        setProduct(data);
      } catch {
        // Если товар не найден или другая ошибка — покажем заглушку
        setError(true);
      } finally {
        setFetching(false);
      }
    };

    // Загружаем только если есть id
    if (id) fetchProduct();
  }, [id]);

  // Обработчик нажатия кнопки "Купить"
  const handleBuy = () => {
    // Если пользователь не авторизован — направляем на страницу входа
    if (!user) {
      message.info('Войдите, чтобы совершать покупки');
      navigate('/login');
      return;
    }

    // TODO: Здесь будет логика покупки
    message.info('Функция покупки появится в ближайшее время');
  };

  // Рендер: состояния загрузки и ошибок

  // Пока проверяется сессия или загружаются данные — показываем спиннер
  if (fetching || loading) {
    return <Spin style={{ display: 'block', marginTop: 40 }} />;
  }

  // Если ошибка загрузки или товар не найден — показываем 404
  if (error || !product) {
    return <Result status="404" title="Товар не найден" />;
  }

  // Рендер: карточка товара
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Title level={2}>{product.title}</Title>
      <Card>
        <Descriptions bordered column={1}>
          <Descriptions.Item label="Категория">{product.category.name}</Descriptions.Item>
          <Descriptions.Item label="Цена">{product.price} ₽</Descriptions.Item>
          <Descriptions.Item label="В наличии">{product.stock} шт.</Descriptions.Item>
          <Descriptions.Item label="Рейтинг">{product.rating ?? 0}</Descriptions.Item>
          <Descriptions.Item label="Описание">{product.description || '—'}</Descriptions.Item>
        </Descriptions>

        <div style={{ marginTop: 20 }}>
          {product.stock > 0 ? (
            // Если товар в наличии — кнопка активна
            <Button type="primary" size="large" onClick={handleBuy}>
              Купить
            </Button>
          ) : (
            // Иначе кнопка заблокирована
            <Button disabled size="large">
              Нет в наличии
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ProductPage;