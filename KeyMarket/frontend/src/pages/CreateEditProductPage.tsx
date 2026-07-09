// Страница создания и редактирования товара
import { useEffect, useState, useCallback } from 'react';
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
  Modal,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
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

// Вспомогательная функция для создания обрезанного изображения
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

const getCroppedImg = async (
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> => {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas is empty'));
    }, 'image/jpeg');
  });
};

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

  const categories = useCategories(!!user);
  const safeCategories = Array.isArray(categories) ? categories : [];

  const { productData, loading: productLoading } = useProduct(id, isEdit, !!user);

  // Состояния для кадрирования
  const [cropModalVisible, setCropModalVisible] = useState(false);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
        productType: productData.productType || 'GAME',
      });
      if (productData.imageUrl) {
        setImageUrl(productData.imageUrl);
      }
    }
  }, [isEdit, productData, safeCategories, form]);

  // Обработчик выбора файла – открывает модалку для кадрирования
  const handleBeforeUpload = (file: File) => {
    // Проверяем размер файла
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      return false;
    }

    // Создаём объект URL для предпросмотра
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
      setCropFile(file);
      setCropModalVisible(true);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);

    return false; // предотвращаем автоматическую загрузку
  };

  // Обработчик подтверждения кадрирования
  const handleCropConfirm = async () => {
    if (!croppedAreaPixels || !cropImageSrc) return;
    try {
      const croppedBlob = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      // Создаём объект File из Blob
      const newFile = new File([croppedBlob], cropFile?.name || 'cropped.jpg', {
        type: 'image/jpeg',
      });

      // Загружаем на сервер
      const formData = new FormData();
      formData.append('file', newFile);
      const { data } = await apiClient.post('/upload/product-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImageUrl(data.imageUrl);
      message.success('Изображение загружено');
      setCropModalVisible(false);
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 413) {
        message.error('Файл слишком большой. Максимальный размер: 5 МБ.');
      } else {
        message.error('Ошибка загрузки изображения');
      }
    }
  };

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
        productType: values.productType || 'GAME',
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

          {/* Тип товара */}
          <Form.Item
            name="productType"
            label="Тип товара"
            rules={[{ required: true, message: 'Выберите тип товара' }]}
            initialValue="GAME"
          >
            <Select
              placeholder="Выберите тип"
              options={[
                { value: 'GAME', label: 'Игра' },
                { value: 'DLC', label: 'DLC' },
              ]}
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

          {/* Изображение товара с кадрированием */}
          <Form.Item label="Изображение товара">
            <Upload
              listType="picture-card"
              showUploadList={false}
              beforeUpload={handleBeforeUpload}
              accept="image/*"
            >
              {imageUrl ? (
                <div style={{
                  width: 120,
                  height: 90,      // соотношение 4:3
                  overflow: 'hidden',
                  borderRadius: 8,
                  border: '1px solid #434343',
                }}>
                  <img
                    src={imageUrl}
                    alt="предпросмотр"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',   // эмуляция карточки
                    }}
                  />
                </div>
              ) : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>Загрузить</div>
                </div>
              )}
            </Upload>
            <Text type="secondary" style={{ display: 'block', marginTop: 4 }}>
              При загрузке откроется инструмент кадрирования. Рекомендуемый формат — 4:3.
            </Text>
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

      {/* Модальное окно кадрирования */}
      <Modal
        title="Обрежьте изображение"
        open={cropModalVisible}
        onOk={handleCropConfirm}
        onCancel={() => setCropModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
        width={600}
        bodyStyle={{ height: 400, position: 'relative', background: '#f0f0f0' }}
      >
        {cropImageSrc && (
          <Cropper
            image={cropImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            objectFit="cover"
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        )}
      </Modal>
    </div>
  );
};

export default CreateEditProductPage;