// ============================================================================
// Страница создания и редактирования товара
// Используется как для добавления нового товара, так и для изменения существующего.
// Режим определяется по URL: /create-product (создание) или /edit-product/:id (редактирование).
// ============================================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  message,
  Space,
  Card,
  Typography,
} from 'antd';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios';

// Вынесенные модули
import { FormValues } from '../types/product';                // Типы формы
import { KEY_PATTERN } from '../constants/validation';        // Константа формата ключа
import { validateKeys } from '../utils/validateKeys';         // Валидатор ключей
import { useCategories } from '../hooks/useCategories';       // Хук загрузки категорий
import { useProduct } from '../hooks/useProduct';             // Хук загрузки товара
import { KeyPreviewList } from '../components/KeyPreviewList';// Визуальный список ключей

// Компоненты Ant Design
const { TextArea } = Input;
const { Text } = Typography;

// ============================================================================
// Компонент
// ============================================================================

const CreateEditProductPage = () => {
  // --- Получаем параметры из URL и определяем режим работы ---
  const { id } = useParams();                       // ID товара (только при редактировании)
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit-product');  // true = редактирование, false = создание

  // --- Сессия пользователя ---
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);

  // --- Локальное состояние ---
  const [form] = Form.useForm<FormValues>();        // экземпляр формы Ant Design
  const [loadingForm, setLoadingForm] = useState(false);         // индикатор отправки формы
  const [keysPreview, setKeysPreview] = useState<string[]>([]);  // ключи для визуальной валидации

  // --- Кастомные хуки (вынесли логику загрузки данных) ---
  const categories = useCategories(!!user);                    // список категорий
  const productLoading = useProduct(id, isEdit, form, !!user);  // загрузка товара при редактировании

  // =========================================================================
  // Эффекты
  // =========================================================================

  /**
   * Защита маршрута: если сессия невалидна — редирект на логин.
   * Ждём окончания проверки сессии (loading === false), чтобы не моргать.
   */
  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // =========================================================================
  // Отправка формы
  // =========================================================================

  /**
   * Обработчик успешной отправки формы.
   * В зависимости от режима вызывает создание или обновление товара.
   */
  const onFinish = async (values: FormValues) => {
    setLoadingForm(true);
    try {
      // Базовый payload — поля, общие для создания и редактирования
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
      };

      if (isEdit && id) {
        // --- Редактирование ---
        if (values.newKeys) {
          // Преобразуем текст ключей в массив строк
          payload.newKeys = values.newKeys
            .split('\n')
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        }
        if (values.status) payload.status = values.status;
        await apiClient.put(`/products/${id}`, payload);
        message.success('Товар обновлён');
      } else {
        // --- Создание ---
        payload.keys = (values.keys ?? '')
          .split('\n')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        await apiClient.post('/products', payload);
        message.success('Товар создан');
      }
      // После успеха возвращаемся к списку товаров
      navigate('/my-products');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoadingForm(false);
    }
  };

  // =========================================================================
  // Рендер
  // =========================================================================

  // Пока проверяется сессия — ничего не показываем
  if (loading) return null;

  // Если пользователь не авторизован (уже должны были редиректнуть) — ничего не рендерим
  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>{isEdit ? 'Редактирование товара' : 'Добавить товар'}</h1>
      <Card>
        {/* Форма на основе Ant Design */}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* ---------- Название ---------- */}
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          {/* ---------- Описание ---------- */}
          <Form.Item name="description" label="Описание">
            <TextArea rows={4} />
          </Form.Item>

          {/* ---------- Категория ---------- */}
          <Form.Item
            name="categoryId"
            label="Категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select
              placeholder="Выберите категорию"
              options={categories.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
            />
          </Form.Item>

          {/* ---------- Цена ---------- */}
          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {/* ---------- Статус (только при редактировании) ---------- */}
          {isEdit && (
            <Form.Item name="status" label="Статус">
              <Select
                options={[
                  { value: 'active', label: 'Активный' },
                  { value: 'inactive', label: 'Неактивный' },
                ]}
              />
            </Form.Item>
          )}

          {/* ---------- Ключи (только при создании) ---------- */}
          {!isEdit && (
            <Form.Item
              name="keys"
              label="Ключи (по одному на строку)"
              rules={[{ validator: validateKeys }]}
              extra={
                <Text type="secondary">
                  Формат ключа: XXXXX-XXXXX-XXXXX (Steam). Каждый ключ с новой строки.
                </Text>
              }
            >
              <TextArea
                rows={6}
                placeholder="XXXXX-XXXXX-XXXXX"
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .filter((line) => line.trim().length > 0);
                  setKeysPreview(lines);
                }}
              />
            </Form.Item>
          )}

          {/* ---------- Новые ключи (только при редактировании) ---------- */}
          {isEdit && (
            <Form.Item
              name="newKeys"
              label="Новые ключи (по одному на строку)"
              rules={[
                {
                  validator: (_: unknown, value: string | undefined) => {
                    if (!value || !value.trim()) return Promise.resolve();
                    return validateKeys(_, value);
                  },
                },
              ]}
              extra={
                <Text type="secondary">
                  Необязательно. Формат ключа: XXXXX-XXXXX-XXXXX (Steam).
                </Text>
              }
            >
              <TextArea
                rows={4}
                placeholder="XXXXX-XXXXX-XXXXX"
                onChange={(e) => {
                  const lines = e.target.value
                    .split('\n')
                    .filter((line) => line.trim().length > 0);
                  setKeysPreview(lines);
                }}
              />
            </Form.Item>
          )}

          {/* ---------- Визуальная обратная связь по ключам ---------- */}
          <KeyPreviewList keys={keysPreview} />

          {/* ---------- Кнопки ---------- */}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loadingForm || productLoading}>
                {isEdit ? 'Сохранить' : 'Создать'}
              </Button>
              <Button onClick={() => navigate('/my-products')}>Отмена</Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateEditProductPage;