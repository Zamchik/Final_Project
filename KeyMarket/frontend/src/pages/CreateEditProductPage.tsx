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
} from 'antd';
import apiClient from '../api/client';
import { AxiosError } from 'axios';

const { TextArea } = Input;

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

  const [form] = Form.useForm<FormValues>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch {
        message.warning('Не удалось загрузить категории');
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (isEdit && id) {
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
  }, [id, isEdit, form]);

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
            .filter((k: string) => k.trim() !== '');
        }
        if (values.status) payload.status = values.status;
        await apiClient.put(`/products/${id}`, payload);
        message.success('Товар обновлён');
      } else {
        payload.keys = (values.keys ?? '')
          .split('\n')
          .filter((k: string) => k.trim() !== '');
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
              rules={[
                { required: true, message: 'Добавьте хотя бы один ключ' },
              ]}
            >
              <TextArea rows={4} placeholder="Ключ1&#10;Ключ2&#10;Ключ3" />
            </Form.Item>
          )}

          {isEdit && (
            <Form.Item
              name="newKeys"
              label="Новые ключи (по одному на строку)"
            >
              <TextArea rows={4} placeholder="Если нужно добавить ключи" />
            </Form.Item>
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