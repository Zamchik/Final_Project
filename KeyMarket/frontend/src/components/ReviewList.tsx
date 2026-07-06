// Список отзывов о товаре
import { useEffect, useState, useCallback } from 'react';
import { List, Rate, Typography, message } from 'antd';
import apiClient from '../api/client';

const { Text } = Typography;

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: number; email: string };
}

interface ReviewListProps {
  productId: number;
}

const ReviewList = ({ productId }: ReviewListProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get(`/products/${productId}/reviews`, {
        params: { page, limit: 10 },
      });
      setReviews(data.reviews);
      setTotal(data.total);
    } catch {
      message.error('Ошибка загрузки отзывов');
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return (
    <div style={{ marginTop: 24 }}>
      <h3>Отзывы</h3>
      <List
        loading={loading}
        dataSource={reviews}
        pagination={{
          current: page,
          total,
          pageSize: 10,
          onChange: (p) => setPage(p),
          showTotal: (t) => `${t} отзывов`,
        }}
        renderItem={(item) => (
          <List.Item>
            <div>
              <Rate value={item.rating} disabled style={{ fontSize: 16 }} />
              <Text type="secondary"> от {item.user.email}</Text>
              {item.comment && <p>{item.comment}</p>}
            </div>
          </List.Item>
        )}
      />
    </div>
  );
};

export default ReviewList;