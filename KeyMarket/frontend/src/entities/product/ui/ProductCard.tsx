// Переиспользуемая карточка товара для каталога, главной, избранного.
// Содержит изображение, тег типа, кнопку избранного, цену, название, категорию, продажи и кнопку "Купить".
import { Button, Typography, Tag } from 'antd';
import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { WishlistButton } from '@/features/wishlist';

const { Paragraph, Text } = Typography;

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
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
            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
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
            <WishlistButton product={product} />
          </div>
        </div>

        {/* Информация */}
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

        {/* Кнопка "Купить" */}
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