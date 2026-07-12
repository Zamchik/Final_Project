// Кнопка для добавления/удаления товара из избранного.
// Используется в карточке товара (ProductCard) и на странице товара.
import { Button, message } from 'antd';
import { HeartFilled } from '@ant-design/icons';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import type { Product } from '@/entities/product/types';

interface WishlistButtonProps {
  product: Product;
  size?: number;       // размер иконки, по умолчанию 24
}

export const WishlistButton = ({ product, size = 24 }: WishlistButtonProps) => {
  const user = useAuthStore((s) => s.user);
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      message.info('Войдите, чтобы добавить в избранное');
      return;
    }
    if (inWishlist) {
      removeItem(product.id);
    } else {
      addItem(product);
    }
  };

  return (
    <Button
      type="text"
      icon={
        <HeartFilled style={{
          fontSize: size,
          color: inWishlist ? '#722ed1' : '#ffffff',
          stroke: 'black',
          strokeWidth: 48,
        }} />
      }
      onClick={handleClick}
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        lineHeight: 1,
      }}
    />
  );
};