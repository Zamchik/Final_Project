// Страница избранного: отображает сохранённые товары.
import { Typography, Row, Col, Empty, Button } from 'antd';
import { HeartOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';
import ProductCard from '@/entities/product/ui/ProductCard';

const { Title } = Typography;

const WishlistPage = () => {
  const items = useWishlistStore((s) => s.items);

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <Empty description="Список избранного пуст" />
        <Link to="/catalog"><Button type="primary" style={{ marginTop: 16 }}>Перейти в каталог</Button></Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 16px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <HeartOutlined style={{ marginRight: 8 }} />
        Избранное ({items.length})
      </Title>
      <Row gutter={[24, 24]}>
        {items.map(item => (
          <Col xs={12} sm={12} md={8} lg={8} xl={6} xxl={4} key={item.id}>
            <ProductCard product={item} />
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default WishlistPage;