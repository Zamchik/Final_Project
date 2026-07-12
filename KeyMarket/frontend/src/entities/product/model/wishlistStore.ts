// Хранилище избранного (Zustand).
// Содержит список товаров в избранном и методы для добавления/удаления.
// Данные сохраняются в localStorage с ключом, привязанным к ID пользователя.
import { create } from 'zustand';
import type { Product } from '../types';

interface WishlistState {
  items: Product[];
  addItem: (item: Product) => void;
  removeItem: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  setItems: (items: Product[]) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  // Добавляет товар в избранное, если его ещё нет.
  addItem: (item) => {
    if (!get().items.find((i) => i.id === item.id)) {
      set({ items: [...get().items, item] });
    }
  },

  // Удаляет товар из избранного по ID.
  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  // Проверяет, находится ли товар в избранном.
  isInWishlist: (id) => get().items.some((i) => i.id === id),

  // Заменяет весь список избранного (используется при загрузке/смене пользователя).
  setItems: (items) => set({ items }),

  // Полностью очищает избранное (используется при выходе из аккаунта).
  clearWishlist: () => set({ items: [] }),
}));