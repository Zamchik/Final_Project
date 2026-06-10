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

// Компоненты Ant Design для ввода текста
const { TextArea } = Input;
const { Text } = Typography;

/**
 * Регулярное выражение для валидации формата Steam-ключа.
 * Ожидаемый формат: XXXXX-XXXXX-XXXXX (буквы и цифры).
 * Можно вынести в отдельный файл констант при декомпозиции.
 */
const KEY_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/i;

// ---------------------------------------------------------------------------
// Типы и интерфейсы
// ---------------------------------------------------------------------------

/** Категория товара, получаемая с бэкенда */
interface Category {
  id: number;
  name: string;
}

/** Значения полей формы (используется с Ant Design Form) */
interface FormValues {
  title: string;
  description?: string;
  price: number;
  categoryId: number;
  status?: string;
  keys?: string;
  newKeys?: string;
}

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
  const [categories, setCategories] = useState<Category[]>([]);  // список категорий для селекта
  const [loadingForm, setLoadingForm] = useState(false);         // индикатор отправки формы
  const [keysPreview, setKeysPreview] = useState<string[]>([]);  // ключи для визуальной валидации

  // =========================================================================
  // Эффекты (при декомпозиции можно вынести в кастомные хуки)
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

  /**
   * Загрузка списка категорий для выпадающего списка.
   * Запрашивается только при наличии активной сессии.
   */
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch {
        message.warning('Не удалось загрузить категории');
      }
    };
    if (user) fetchCategories();
  }, [user]);

  /**
   * Если режим редактирования — загружаем существующий товар и заполняем форму.
   */
  useEffect(() => {
    if (isEdit && id && user) {
      const fetchProduct = async () => {
        setLoadingForm(true);
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
          setLoadingForm(false);
        }
      };
      fetchProduct();
    }
  }, [id, isEdit, form, user]);

  // =========================================================================
  // Валидация ключей
  // =========================================================================

  /**
   * Кастомный валидатор для поля ключей.
   * Проверяет:
   *   1. Наличие хотя бы одного ключа.
   *   2. Формат каждого ключа (XXXXX-XXXXX-XXXXX).
   *   3. Отсутствие дубликатов.
   */
  const validateKeys = (_: unknown, value: string | undefined) => {
    if (!value || !value.trim()) {
      return Promise.reject(new Error('Добавьте хотя бы один ключ'));
    }

    // Разбиваем строку на массив ключей, удаляем пустые
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
                    if (!value || !value.trim()) return Promise.resolve();  // необязательное поле
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
                    {/* Индикатор валидности */}
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

          {/* ---------- Кнопки ---------- */}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loadingForm}>
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