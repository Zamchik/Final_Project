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

const { TextArea } = Input;
const { Text } = Typography;

// Формат Steam-ключа (можно вынести в константы и расширить при необходимости)
const KEY_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

interface Category {
  id: number;
  name: string;
}

interface FormValues {
  title: string;
  description?: string;
  price: number;
  categoryId: number;
  status?: string;
  keys?: string;
  newKeys?: string;
}

const CreateEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit-product');
  const token = useAuthStore((s) => s.token);

  const [form] = Form.useForm<FormValues>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Для отображения валидности ключей в реальном времени (опционально)
  const [keysPreview, setKeysPreview] = useState<string[]>([]);

  // Защита: без токена на логин
  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch {
        message.warning('Не удалось загрузить категории');
      }
    };
    if (token) fetchCategories();
  }, [token]);

  useEffect(() => {
    if (isEdit && id && token) {
      const fetchProduct = async () => {
        setLoading(true);
        try {
          const { data } = await apiClient.get(`/products/${id}`);
          form.setFieldsValue({
            title: data.title,
            description: data.description,
            price: Number(data.price),
            categoryId: data.categoryId,
            status: data.status,
          });
        } catch {
          message.error('Ошибка загрузки товара');
        } finally {
          setLoading(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit, form, token]);

  // Кастомный валидатор для списка ключей
const validateKeys = (_: unknown, value: string | undefined) => {
  if (!value || !value.trim()) {
    return Promise.reject(new Error('Добавьте хотя бы один ключ'));
  }
  const keys = value
    .split('\n')
    .map((k) => k.trim())
    .filter((k) => k.length > 0);

  // Проверка формата
  const invalidKeys: string[] = [];
  keys.forEach((key) => {
    if (!KEY_PATTERN.test(key)) {
      invalidKeys.push(key);
    }
  });
  if (invalidKeys.length > 0) {
    return Promise.reject(
      new Error(
        `Некорректные ключи: ${invalidKeys.join(', ')}. Ожидаемый формат: XXXXX-XXXXX-XXXXX`
      )
    );
  }

  // Проверка на дубликаты
  const seen = new Set<string>();
  const duplicates: string[] = [];
  keys.forEach((key) => {
    if (seen.has(key)) {
      duplicates.push(key);
    } else {
      seen.add(key);
    }
  });
  if (duplicates.length > 0) {
    return Promise.reject(
      new Error(`Обнаружены повторяющиеся ключи: ${duplicates.join(', ')}`)
    );
  }

  return Promise.resolve();
};

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
      };

      if (isEdit && id) {
        if (values.newKeys) {
          payload.newKeys = values.newKeys
            .split('\n')
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        }
        if (values.status) payload.status = values.status;
        await apiClient.put(`/products/${id}`, payload);
        message.success('Товар обновлён');
      } else {
        payload.keys = (values.keys ?? '')
          .split('\n')
          .map((k) => k.trim())
          .filter((k) => k.length > 0);
        await apiClient.post('/products', payload);
        message.success('Товар создан');
      }
      navigate('/my-products');
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>{isEdit ? 'Редактирование товара' : 'Добавить товар'}</h1>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Описание">
            <TextArea rows={4} />
          </Form.Item>

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

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

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

          {isEdit && (
            <Form.Item
              name="newKeys"
              label="Новые ключи (по одному на строку)"
              rules={[
                {
                  validator: (_: unknown, value: string | undefined) => {
                    if (!value || !value.trim()) return Promise.resolve(); // необязательное поле
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

          {/* Визуальная обратная связь по ключам (как на ggsel) */}
          {keysPreview.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {keysPreview.map((key, idx) => {
                const isValid = KEY_PATTERN.test(key);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '4px 0',
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        backgroundColor: isValid ? '#52c41a' : '#ff4d4f',
                        display: 'inline-block',
                      }}
                    />
                    <Text
                      style={{
                        color: isValid ? '#52c41a' : '#ff4d4f',
                        fontFamily: 'monospace',
                      }}
                    >
                      {key}
                    </Text>
                    {!isValid && (
                      <Text type="danger" style={{ fontSize: 12 }}>
                        Неверный формат
                      </Text>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
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