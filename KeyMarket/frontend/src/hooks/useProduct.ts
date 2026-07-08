import { useState, useEffect } from 'react';
import { message } from 'antd';
import apiClient from '../api/client';

interface ProductKey {
  id: number;
  keyValue: string;
  isSold: boolean;
}

interface ProductData {
  id: number;
  title: string;
  description: string;
  price: string;
  categoryId: number;
  status: string;
  imageUrl: string | null;
  productType: string;
  keys: ProductKey[];
}

export const useProduct = (
  id: string | undefined,
  isEdit: boolean,
  enabled: boolean
) => {
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit || !id || !enabled) return;

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
  }, [id, isEdit, enabled]);

  return { productData, loading };
};