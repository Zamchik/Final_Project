import { Button, Typography, Tag, message } from 'antd';
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
        productType: product.productType,
        category: product.category,
        sales: product.sales,
      });
    }
  };

  const formatSales = (count: number) => {
    if (count > 1000) return '1000+ продаж';
    return `${count} продаж`;
  };

  return (
    <Link to={`/product/${product.id}`} style={{ textDecoration: 'none' }}>
      <div
        style={{
          borderRadius: 8,
          background: '#2a2a2a',
          overflow: 'hidden',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(114, 46, 209, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = '';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Изображение */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '4 / 3', background: '#1a1a1a' }}>
          <img
            src={product.imageUrl || '/placeholder.png'}
            alt={product.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.png'; }}
          />
          <div style={{
            position: 'absolute',
            top: 12,
            left: 12,
            right: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 2,
          }}>
            {product.productType && (
              <Tag color="purple" style={{ fontSize: 14, lineHeight: '20px', margin: 0 }}>
                {product.productType === 'DLC' ? 'DLC' : 'Игра'}
              </Tag>
            )}
            <Button
              type="text"
              icon={
                <HeartFilled style={{
                  fontSize: 24,
                  color: inWishlist ? '#722ed1' : '#ffffff',
                  stroke: 'black',
                  strokeWidth: 48,
                }} />
              }
              onClick={handleWishlist}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                lineHeight: 1,
                marginLeft: 'auto',
              }}
            />
          </div>
        </div>

        {/* Информация о товаре */}
        <div style={{ padding: '12px 16px 16px 16px', flex: 1 }}>
          <div style={{ marginBottom: 8 }}>
            <Text strong style={{ fontSize: 20, color: '#fff', lineHeight: 1.2 }}>
              {product.price} ₽
            </Text>
          </div>
          <div style={{ height: '2.6em', marginBottom: 16 }}>
            <Paragraph
              strong
              ellipsis={{ rows: 2 }}
              style={{ fontSize: 16, color: '#fff', lineHeight: 1.3, marginBottom: 0 }}
            >
              {product.title}
            </Paragraph>
          </div>
          <div style={{ marginBottom: 4 }}>
            {product.category && (
              <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.4 }}>
                {product.category.name}
              </Text>
            )}
          </div>
          {product.sales !== undefined && product.sales !== null && (
            <div>
              <Text type="secondary" style={{ fontSize: 14, lineHeight: 1.4 }}>
                {formatSales(product.sales)}
              </Text>
            </div>
          )}
        </div>

        <div style={{ width: '100%' }}>
          <Button
            type="primary"
            block
            style={{
              background: '#722ed1',
              borderColor: '#722ed1',
              height: 40,
              fontSize: 16,
              fontWeight: 500,
              borderRadius: '0 0 8px 8px',
            }}
          >
            Купить
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;