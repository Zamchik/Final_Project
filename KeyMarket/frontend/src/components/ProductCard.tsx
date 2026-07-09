import { Card, Button, Typography, Tag, message } from 'antd';
import { HeartFilled } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useWishlistStore } from '../stores/wishlistStore';

const { Paragraph, Text } = Typography;

interface ProductCardProps {
  product: {
    id: number;
    title: string;
    price: string;
    imageUrl: string | null;
    productType?: string;
    category?: { name: string };
  };
}

const ProductCard = ({ product }: ProductCardProps) => {
  const user = useAuthStore((s) => s.user);
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(product.id);

  const handleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) {
      message.info('Войдите, чтобы добавить в избранное');
      return;
    }
    if (inWishlist) {
      removeItem(product.id);
    } else {
      addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        imageUrl: product.imageUrl,
      });
    }
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card
        hoverable
        style={{ position: 'relative', overflow: 'hidden', height: '100%' }}
        cover={
          <div style={{
            height: 140,
            background: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.title}
              style={{
                maxHeight: '100%',
                maxWidth: '100%',
                objectFit: 'contain'
              }}
              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
            />
            <Button
              type="text"
              icon={
                <HeartFilled style={{
                  fontSize: 20,
                  color: inWishlist ? '#722ed1' : '#ffffff',
                  stroke: 'black',
                  strokeWidth: 48,
                }} />
              }
              onClick={handleWishlist}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                background: 'transparent',
                border: 'none',
                padding: 0,
                zIndex: 2,
                lineHeight: 1,
              }}
            />
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 0' }}>
          {/* Тип товара – фиксированная высота */}
          <div style={{ height: 24, marginBottom: 4 }}>
            {product.productType && (
              <Tag color="purple" style={{ width: 'fit-content', fontSize: 12, lineHeight: '20px' }}>
                {product.productType === 'DLC' ? 'DLC' : 'Игра'}
              </Tag>
            )}
          </div>

          {/* Название – всегда 2 строки с многоточием */}
          <div style={{ height: '2.6em', marginBottom: 4 }}>
            <Paragraph
              strong
              ellipsis={{ rows: 2 }}
              style={{
                fontSize: 16,
                color: '#fff',
                lineHeight: 1.3,
                marginBottom: 0,
              }}
            >
              {product.title}
            </Paragraph>
          </div>

          {/* Цена */}
          <div style={{ height: '1.3em', marginBottom: 4 }}>
            <Text strong style={{ fontSize: 16, color: '#fff' }}>
              {product.price} ₽
            </Text>
          </div>

          {/* Категория */}
          <div style={{ height: '1.3em' }}>
            {product.category && (
              <Text type="secondary" style={{ lineHeight: 1.3 }}>
                {product.category.name}
              </Text>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;