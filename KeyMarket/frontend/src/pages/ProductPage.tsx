// Страница карточки товара (публичная)
// Отображает детальную информацию о товаре и кнопку "Купить".
// После покупки показывает заказ и ключ.
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Button, Spin, Result, Typography, message, Modal, Radio } from 'antd';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

const { Title, Text } = Typography;

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

// Тип для результата заказа (то, что вернёт бэкенд)
interface OrderResult {
  id: number;
  totalPrice: string;
  items: Array<{
    product: { title: string };
    productKey: { keyValue: string };
  }>;
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

  // Состояние для оформления покупки
  const [isModalOpen, setIsModalOpen] = useState(false);              // модальное окно оплаты
  const [paymentMethod, setPaymentMethod] = useState('balance');      // выбранный способ оплаты (пока все = баланс)
  const [submitting, setSubmitting] = useState(false);                // индикатор отправки заказа
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null); // результат покупки

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

  // Обработчики покупки

  // Открывает модальное окно оформления заказа.
  const handleBuy = () => {
    if (!user) {
      message.info('Войдите, чтобы совершать покупки');
      navigate('/login');
      return;
    }
    setIsModalOpen(true);
  };


  // Отправляет запрос на создание заказа (оплата балансом).
  const handlePayment = async () => {
    if (!product) return;
    setSubmitting(true);
    try {
      const { data } = await apiClient.post('/orders', { productId: product.id });
      setOrderResult(data);       // сохраняем результат для отображения ключа
      setIsModalOpen(false);      // закрываем модальное окно
      message.success('Покупка совершена!');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      message.error(axiosError.response?.data?.error || 'Ошибка оплаты');
    } finally {
      setSubmitting(false);
    }
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

  // Рендер: карточка товара и результаты покупки
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

      {/* Модальное окно оформления заказа  */}
      <Modal
        title="Оформление заказа"
        open={isModalOpen}
        onOk={handlePayment}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={submitting}
        okText="Оплатить"
        cancelText="Отмена"
      >
        <p>
          Вы покупаете: <Text strong>{product.title}</Text>
        </p>
        <p>
          Сумма: <Text strong>{product.price} ₽</Text>
        </p>

        {/* Выбор способа оплаты (пока все списывают с баланса)  */}
        <Radio.Group
          onChange={(e) => setPaymentMethod(e.target.value)}
          value={paymentMethod}
        >
          <Radio value="balance">Баланс</Radio>
          <Radio value="card">Карта (эмуляция)</Radio>
          <Radio value="sbp">СБП (эмуляция)</Radio>
        </Radio.Group>

        <p style={{ marginTop: 16, color: '#888' }}>
          Сейчас все способы списывают средства с вашего баланса.
        </p>
      </Modal>

      {/* Результат покупки (показывается после успешного заказа)  */}
      {orderResult && (
        <Card style={{ marginTop: 20 }}>
          <Title level={4}>Заказ #{orderResult.id} успешно оформлен!</Title>
          <Descriptions column={1}>
            <Descriptions.Item label="Товар">
              {orderResult.items[0].product.title}
            </Descriptions.Item>
            <Descriptions.Item label="Ключ">
              <Text copyable code>
                {orderResult.items[0].productKey.keyValue}
              </Text>
            </Descriptions.Item>
            <Descriptions.Item label="Сумма">
              {orderResult.totalPrice} ₽
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </div>
  );
};

export default ProductPage;