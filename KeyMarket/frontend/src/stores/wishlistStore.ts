import { create } from 'zustand';

interface WishlistItem {
  id: number;
  title: string;
  price: string;
  imageUrl: string | null;
  productType?: string;
  category?: { name: string };
  sales?: number;
}

interface WishlistState {
  items: WishlistItem[];
  addItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  setItems: (items: WishlistItem[]) => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  items: [],

  addItem: (item) => {
    if (!get().items.find((i) => i.id === item.id)) {
      set({ items: [...get().items, item] });
    }
  },

  removeItem: (id) => {
    set({ items: get().items.filter((i) => i.id !== id) });
  },

  isInWishlist: (id) => get().items.some((i) => i.id === id),

  setItems: (items) => set({ items }),
}));