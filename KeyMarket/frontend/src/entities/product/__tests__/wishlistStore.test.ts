import { describe, it, expect, beforeEach } from 'vitest';
import { useWishlistStore } from '../model/wishlistStore';

const product = { id: 1, title: 'Test', price: '100', imageUrl: null };

describe('wishlistStore', () => {
  beforeEach(() => {
    useWishlistStore.setState({ items: [] });
  });

  it('addItem добавляет товар', () => {
    useWishlistStore.getState().addItem(product);
    expect(useWishlistStore.getState().items).toContainEqual(product);
  });

  it('removeItem удаляет товар', () => {
    useWishlistStore.getState().addItem(product);
    useWishlistStore.getState().removeItem(1);
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });

  it('isInWishlist проверяет наличие', () => {
    useWishlistStore.getState().addItem(product);
    expect(useWishlistStore.getState().isInWishlist(1)).toBe(true);
    expect(useWishlistStore.getState().isInWishlist(2)).toBe(false);
  });

  it('clearWishlist очищает', () => {
    useWishlistStore.getState().addItem(product);
    useWishlistStore.getState().clearWishlist();
    expect(useWishlistStore.getState().items).toHaveLength(0);
  });
});