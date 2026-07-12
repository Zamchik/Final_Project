// Хук для загрузки данных одного товара (используется при редактировании).
import { useState, useEffect } from 'react';
import { message } from 'antd';
import apiClient from '@/shared/api/client';
import type { Product } from '../types';

interface ProductData extends Product {
  description: string;
  categoryId: number;
  status: string;
  keys: { id: number; keyValue: string; soldAt: string | null }[];
}

export const useProduct = (id: string | undefined, isEdit: boolean) => {
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;

    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await apiClient.get(`/products/my/${id}`);
        setProductData(data);
      } catch {
        message.error('Ошибка загрузки товара');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, isEdit]);

  return { productData, loading };
};