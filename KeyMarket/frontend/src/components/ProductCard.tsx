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
    sales?: number;
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

  const formatSales = (count: number) => {
    if (count > 1000) return '1000+ продаж';
    return `${count} продаж`;
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card
        hoverable
        bodyStyle={{ padding: 0 }}
        style={{ position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}
        cover={
          <div style={{
            height: 140,
            background: '#f5f5f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <img
              src={product.imageUrl || '/placeholder.png'}
              alt={product.title}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
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
        {/* Информационная часть – нижний отступ 8px */}
        <div style={{ padding: '4px 8px 8px 8px' }}>
          {/* Тип товара */}
          <div style={{ height: 18, marginBottom: 10 }}>
            {product.productType && (
              <Tag color="purple" style={{ width: 'fit-content', fontSize: 11, lineHeight: '16px' }}>
                {product.productType === 'DLC' ? 'DLC' : 'Игра'}
              </Tag>
            )}
          </div>

          {/* Название */}
          <div style={{ height: '2.2em', marginBottom: 2 }}>
            <Paragraph
              strong
              ellipsis={{ rows: 2 }}
              style={{
                fontSize: 13,
                color: '#fff',
                lineHeight: 1.1,
                marginBottom: 0,
              }}
            >
              {product.title}
            </Paragraph>
          </div>

          {/* Цена */}
          <div style={{ height: '1.1em' }}>
            <Text strong style={{ fontSize: 13, color: '#fff' }}>
              {product.price} ₽
            </Text>
          </div>

          {/* Категория */}
          <div style={{ height: '1.1em' }}>
            {product.category && (
              <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.1 }}>
                {product.category.name}
              </Text>
            )}
          </div>

          {/* Продажи */}
          {product.sales !== undefined && product.sales !== null && (
            <div style={{ height: '1.1em' }}>
              <Text type="secondary" style={{ fontSize: 11, lineHeight: 1.1 }}>
                {formatSales(product.sales)}
              </Text>
            </div>
          )}
        </div>

        {/* Кнопка "Купить" прижата к низу */}
        <div style={{ marginTop: 'auto', width: '100%' }}>
          <Button
            type="primary"
            block
            style={{
              background: '#722ed1',
              borderColor: '#722ed1',
              height: 32,
              fontSize: 13,
              fontWeight: 500,
              borderRadius: '0 0 8px 8px',
            }}
          >
            Купить
          </Button>
        </div>
      </Card>
    </Link>
  );
};

export default ProductCard;