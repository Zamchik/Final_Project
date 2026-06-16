// Хук для загрузки данных товара по ID (режим редактирования)

import { useState, useEffect } from 'react';
import { message } from 'antd';
import { FormInstance } from 'antd/es/form';
import apiClient from '../api/client';
import { FormValues } from '../types/product';

/**
 * Загружает товар по ID и заполняет форму.
 * @param id - ID товара
 * @param isEdit - флаг режима редактирования
 * @param form - экземпляр формы Ant Design
 * @param enabled - условие для выполнения запроса (например, наличие пользователя)
 */
export const useProduct = (
  id: string | undefined,
  isEdit: boolean,
  form: FormInstance<FormValues>,
  enabled: boolean
) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id || !enabled) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        // Запрашиваем товар через защищённый маршрут продавца
        const { data } = await apiClient.get(`/products/my/${id}`);
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
  }, [id, isEdit, form, enabled]);

  return loading;
};