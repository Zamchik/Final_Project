// Хук для загрузки списка категорий с бэкенда

import { useState, useEffect } from 'react';
import { message } from 'antd';
import apiClient from '../api/client';
import { Category } from '../types/product';

/**
 * Загружает категории при монтировании компонента.
 * Возвращает массив категорий.
 */
export const useCategories = (enabled: boolean) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!enabled) return;

    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(data);
      } catch {
        message.warning('Не удалось загрузить категории');
      }
    };

    fetchCategories();
  }, [enabled]);

  return categories;
};