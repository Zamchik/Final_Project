import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  clearWishlist: () => void;
  loadWishlist: (userId: number) => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
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

      clearWishlist: () => set({ items: [] }),

      loadWishlist: (userId: number) => {
        const key = `keymarket-wishlist-${userId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            set({ items: parsed.state?.items || [] });
          } catch {
            set({ items: [] });
          }
        } else {
          set({ items: [] });
        }
      },
    }),
    {
      name: 'keymarket-wishlist',
      getStorage: () => localStorage,
    }
  )
);