// Страница избранного
import { Typography, Row, Col, Card, Empty, Button } from 'antd';
import { HeartOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { useWishlistStore } from '../stores/wishlistStore';

const { Title, Text } = Typography;

const WishlistPage = () => {
  const { items, removeItem } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center' }}>
        <Empty description="Список избранного пуст" />
        <Link to="/catalog">
          <Button type="primary" style={{ marginTop: 16 }}>Перейти в каталог</Button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
      <Title level={2} style={{ marginBottom: 24 }}>
        <HeartOutlined style={{ marginRight: 8 }} />
        Избранное ({items.length})
      </Title>
      <Row gutter={[16, 16]}>
        {items.map((item) => (
          <Col xs={24} sm={12} md={6} key={item.id}>
            <Card
              hoverable
              cover={
                item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    style={{ height: 140, objectFit: 'contain', background: '#fff' }}
                  />
                ) : (
                  <div style={{ height: 140, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HeartOutlined style={{ fontSize: 32, color: '#ccc' }} />
                  </div>
                )
              }
              actions={[
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item.id);
                  }}
                >
                  Удалить
                </Button>,
              ]}
            >
              <Link to={`/product/${item.id}`}>
                <Card.Meta
                  title={item.title}
                  description={<Text strong style={{ fontSize: 16, color: '#fff' }}>{item.price} ₽</Text>}
                />
              </Link>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default WishlistPage;