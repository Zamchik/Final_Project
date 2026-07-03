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
import { AxiosError } from 'axios';

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

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);

  const [form] = Form.useForm<FormValues>();
  const [loadingForm, setLoadingForm] = useState(false);
  const [keysPreview, setKeysPreview] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const categories = useCategories(!!user);
  const safeCategories = Array.isArray(categories) ? categories : []; // защита

  const { productData, loading: productLoading } = useProduct(id, isEdit, !!user);

  // Защита маршрута
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Заполняем форму, когда загружены товар и категории
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

  // Загрузка изображения
  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    setUploading(true);
    try {
      const { data } = await apiClient.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      console.log('✅ imageUrl установлен:', data.imageUrl);
      message.success('Изображение загружено');
    } catch (err) {
      console.error('❌ Ошибка загрузки изображения:', err);
      message.error('Ошибка загрузки изображения');
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
        imageUrl,
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

  if (authLoading) return null;
  if (!user) return null;

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
              options={safeCategories.map((c) => ({
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

          <KeyPreviewList keys={keysPreview} />

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