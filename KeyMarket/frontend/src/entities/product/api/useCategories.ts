// Хук для загрузки списка категорий с сервера.
// Используется при создании/редактировании товара и в фильтрах каталога.
import { useState, useEffect } from 'react';
import { message } from 'antd';
import apiClient from '@/shared/api/client';
import type { Category } from '../types';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await apiClient.get('/categories');
        setCategories(Array.isArray(data) ? data : []);
      } catch {
        message.warning('Не удалось загрузить категории');
        setCategories([]);
      }
    };
    fetchCategories();
  }, []);

  return categories;
};