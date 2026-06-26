// Форма оставления отзыва о товаре
// Принимает productId и orderId, а также callback после успешной отправки
import { useState } from 'react';
import { Modal, Rate, Input, Button, message } from 'antd';
import apiClient from '../api/client';
import { AxiosError } from 'axios';

const { TextArea } = Input;

interface ReviewFormProps {
  productId: number;
  orderId: number;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void; // вызывается после успешной отправки (обновить список)
}

const ReviewForm = ({ productId, orderId, visible, onClose, onSuccess }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      message.warning('Поставьте оценку');
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', {
        productId,
        orderId,
        rating,
        comment,
      });
      message.success('Отзыв отправлен!');
      setRating(0);
      setComment('');
      onSuccess(); // обновить список заказов или отзывов
      onClose();
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка отправки отзыва');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Оставить отзыв"
      open={visible}
      onOk={handleSubmit}
      onCancel={() => {
        setRating(0);
        setComment('');
        onClose();
      }}
      confirmLoading={submitting}
      okText="Отправить"
      cancelText="Отмена"
    >
      <div style={{ marginBottom: 16 }}>
        <Rate value={rating} onChange={setRating} />
      </div>
      <TextArea
        rows={4}
        placeholder="Расскажите о товаре (необязательно)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
    </Modal>
  );
};

export default ReviewForm;