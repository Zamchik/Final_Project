// Страница создания и редактирования товара
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Upload,
  message,
  Space,
  Card,
  Typography,
  Tag,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios'; // используется для проверки ошибок запроса

import { FormValues } from '../types/product';
import { validateKeys } from '../utils/validateKeys';
import { useCategories } from '../hooks/useCategories';
import { useProduct } from '../hooks/useProduct';
import { KeyPreviewList } from '../components/KeyPreviewList';

const { TextArea } = Input;
const { Text } = Typography;

const CreateEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit-product');

  // Состояния и хуки
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [form] = Form.useForm<FormValues>();
  const [loadingForm, setLoadingForm] = useState(false);
  const [keysPreview, setKeysPreview] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = useCategories(!!user);
  const safeCategories = Array.isArray(categories) ? categories : [];

  const { productData, loading: productLoading } = useProduct(id, isEdit, !!user);

  // Защита маршрута
  useEffect(() => {
    if (!fetched && !authLoading) {
      fetchUser();
    }
    if (fetched && !user) {
      navigate('/login');
    }
  }, [fetched, authLoading, user, navigate, fetchUser]);

  // Сброс формы при переходе в режим создания
  useEffect(() => {
    if (!isEdit) {
      form.resetFields();
      setImageUrl(null);
      setKeysPreview([]);
    }
  }, [isEdit, form]);

  // Заполнение формы при редактировании
  useEffect(() => {
    if (isEdit && productData && safeCategories.length > 0) {
      form.setFieldsValue({
        title: productData.title,
        description: productData.description,
        price: Number(productData.price),
        categoryId: productData.categoryId,
        status: productData.status,
      });
      if (productData.imageUrl) {
        setImageUrl(productData.imageUrl);
      }
    }
  }, [isEdit, productData, safeCategories, form]);

  // Загрузка изображения с проверкой размера
  const handleUpload = async (file: File) => {
    // Проверяем размер файла на клиенте (максимум 5 МБ)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      return false; // отменяем автоматическую загрузку
    }

    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await apiClient.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      message.success('Изображение загружено');
    } catch (err) {
      // Если сервер вернул 413 (Payload Too Large) – показываем точное сообщение
      if (err instanceof AxiosError && err.response?.status === 413) {
        message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      } else {
        message.error('Ошибка загрузки изображения');
      }
    } finally {
      setUploading(false);
    }
    return false; // предотвращаем автоматическую отправку формы
  };

  // Отправка формы
  const onFinish = async (values: FormValues) => {
    setLoadingForm(true);
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
        imageUrl, // текущее состояние imageUrl
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
      setLoadingForm(false);
    }
  };

  // Рендер
  if (authLoading || !fetched) return null;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>{isEdit ? 'Редактирование товара' : 'Добавить товар'}</h1>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          {/* Название */}
          <Form.Item
            name="title"
            label="Название"
            rules={[{ required: true, message: 'Введите название' }]}
          >
            <Input />
          </Form.Item>

          {/* Описание */}
          <Form.Item name="description" label="Описание">
            <TextArea rows={4} />
          </Form.Item>

          {/* Категория */}
          <Form.Item
            name="categoryId"
            label="Категория"
            rules={[{ required: true, message: 'Выберите категорию' }]}
          >
            <Select
              placeholder="Выберите категорию"
              options={safeCategories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>

          {/* Цена */}
          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Введите цену' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>

          {/* Статус (только при редактировании) */}
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

          {/* Изображение товара */}
          <Form.Item label="Изображение товара">
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={handleUpload}
              accept="image/*"
            >
              {imageUrl ? (
                <img src={imageUrl} alt="Товар" style={{ width: '100%' }} />
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Загрузить</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          {/* Поле для ключей (только при создании) */}
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

          {/* Новые ключи и текущие ключи (только при редактировании) */}
          {isEdit && (
            <>
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

              {/* Список текущих ключей товара */}
              {productData && productData.keys.length > 0 && (
                <Form.Item label="Текущие ключи">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {productData.keys.map((key) => (
                      <Tag
                        key={key.id}
                        color={key.isSold ? 'red' : 'green'}
                        style={{ fontFamily: 'monospace' }}
                      >
                        {key.keyValue} {key.isSold ? '(продан)' : '(в наличии)'}
                      </Tag>
                    ))}
                  </div>
                </Form.Item>
              )}
            </>
          )}

          {/* Предварительный просмотр ключей (валидация) */}
          <KeyPreviewList keys={keysPreview} />

          {/* Кнопки */}
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