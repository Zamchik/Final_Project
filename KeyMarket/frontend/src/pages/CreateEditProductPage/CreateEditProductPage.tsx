// Страница создания и редактирования товара (FSD).
// Использует сущности product (useCategories, useProduct, KeyPreviewList, типы) и user (authStore).
// Изображение загружается через простой input[type=file] и обрезается на сервере.
import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  Form, Input, InputNumber, Select, Button, message, Space, Typography, Tag, Card, Modal,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import apiClient from '@/shared/api/client';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useCategories } from '@/entities/product/api/useCategories';
import { useProduct } from '@/entities/product/api/useProduct';
import { KeyPreviewList } from '@/entities/product/ui/KeyPreviewList';
import type { FormValues } from '@/entities/product/types';
import { validateKeys } from '@/shared/lib/validateKeys';
import { AxiosError } from 'axios';

const { TextArea } = Input;
const { Text } = Typography;

const CreateEditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = location.pathname.includes('/edit-product');

  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const fetched = useAuthStore((s) => s.fetched);
  const fetchUser = useAuthStore((s) => s.fetchUser);

  const [form] = Form.useForm<FormValues>();
  const [loadingForm, setLoadingForm] = useState(false);
  const [keysPreview, setKeysPreview] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const categories = useCategories();
  const safeCategories = Array.isArray(categories) ? categories : [];
  const { productData, loading: productLoading } = useProduct(id, isEdit);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Защита маршрута
  useEffect(() => {
    if (!fetched && !authLoading) fetchUser();
    if (fetched && !user) navigate('/login');
  }, [fetched, authLoading, user, navigate, fetchUser]);

  // Сброс формы при создании
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
        productType: productData.productType || 'GAME',
      });
      if (productData.imageUrl) setImageUrl(productData.imageUrl);
    }
  }, [isEdit, productData, safeCategories, form]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await apiClient.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      message.success('Изображение загружено');
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 413) {
        message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      } else {
        message.error('Ошибка загрузки изображения');
      }
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const onFinish = async (values: FormValues) => {
    setLoadingForm(true);
    try {
      const payload: Record<string, unknown> = {
        title: values.title,
        description: values.description,
        price: values.price,
        categoryId: values.categoryId,
        imageUrl: imageUrl || null,
        productType: values.productType || 'GAME',
      };

      if (isEdit && id) {
        if (values.newKeys) {
          payload.newKeys = values.newKeys
            .split('\n')
            .map(k => k.trim())
            .filter(k => k.length > 0);
        }
        if (values.status) payload.status = (values.status as string).toUpperCase();
        await apiClient.put(`/products/${id}`, payload);
        message.success('Товар обновлён');
      } else {
        const keysString = values.keys ?? '';
        const trimmedKeys = keysString.split('\n').map(k => k.trim()).filter(k => k.length > 0);
        if (trimmedKeys.length === 0) {
          message.error('Добавьте хотя бы один ключ');
          setLoadingForm(false);
          return;
        }
        payload.keys = trimmedKeys;
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

  if (authLoading || !fetched) return null;
  if (!user) return null;

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <h1>{isEdit ? 'Редактирование товара' : 'Добавить товар'}</h1>
      <Card>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="title" label="Название" rules={[{ required: true, message: 'Введите название' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Описание">
            <TextArea rows={4} />
          </Form.Item>
          <Form.Item name="categoryId" label="Категория" rules={[{ required: true, message: 'Выберите категорию' }]}>
            <Select placeholder="Выберите категорию" options={safeCategories.map(c => ({ value: c.id, label: c.name }))} />
          </Form.Item>
          <Form.Item name="productType" label="Тип товара" rules={[{ required: true }]} initialValue="GAME">
            <Select options={[{ value: 'GAME', label: 'Игра' }, { value: 'DLC', label: 'DLC' }]} />
          </Form.Item>
          <Form.Item name="price" label="Цена" rules={[{ required: true, message: 'Введите цену' }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          {isEdit && (
            <Form.Item name="status" label="Статус">
              <Select options={[{ value: 'active', label: 'Активный' }, { value: 'inactive', label: 'Неактивный' }]} />
            </Form.Item>
          )}

          {/* Загрузка изображения */}
          <Form.Item label="Изображение товара">
            <div style={{ marginBottom: 8 }}>
              {imageUrl ? (
                <div style={{ width: '100%', aspectRatio: '4 / 3', overflow: 'hidden', borderRadius: 8, border: '1px solid #434343', background: '#1a1a1a' }}>
                  <img src={imageUrl} alt="предпросмотр" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              ) : (
                <div onClick={handleUploadClick} style={{ width: '100%', aspectRatio: '4 / 3', background: '#1a1a1a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: '1px dashed #434343', cursor: 'pointer' }}>
                  <PlusOutlined style={{ fontSize: 24, marginBottom: 8, color: '#fff' }} />
                  <span style={{ color: '#fff' }}>Загрузить изображение</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
            <Button onClick={handleUploadClick}>{imageUrl ? 'Изменить изображение' : 'Выбрать файл'}</Button>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              Рекомендуемый формат — 4:3. Изображение будет обрезано до этого формата.
            </Text>
          </Form.Item>

          {/* Ключи */}
          {!isEdit && (
            <Form.Item name="keys" label="Ключи (по одному на строку)" rules={[{ validator: validateKeys }]}
              extra={<Text type="secondary">Формат ключа: XXXXX-XXXXX-XXXXX (Steam). Каждый ключ с новой строки.</Text>}>
              <TextArea rows={6} placeholder="XXXXX-XXXXX-XXXXX" onChange={e => setKeysPreview(e.target.value.split('\n').filter(l => l.trim()))} />
            </Form.Item>
          )}
          {isEdit && (
            <>
              <Form.Item name="newKeys" label="Новые ключи"
                rules={[{ validator: (_: any, value: string | undefined) => !value?.trim() ? Promise.resolve() : validateKeys(_, value) }]}
                extra={<Text type="secondary">Необязательно. Формат ключа: XXXXX-XXXXX-XXXXX (Steam).</Text>}>
                <TextArea rows={4} placeholder="XXXXX-XXXXX-XXXXX" onChange={e => setKeysPreview(e.target.value.split('\n').filter(l => l.trim()))} />
              </Form.Item>
              {productData && productData.keys && productData.keys.length > 0 && (
                <Form.Item label="Текущие ключи">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {productData.keys.map(key => (
                      <Tag key={key.id} color={key.soldAt ? 'red' : 'green'} style={{ fontFamily: 'monospace' }}>
                        {key.keyValue} {key.soldAt ? '(продан)' : '(в наличии)'}
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