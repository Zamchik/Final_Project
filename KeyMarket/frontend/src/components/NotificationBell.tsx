// Компонент "Колокольчик" для отображения уведомлений
import { useEffect, useState } from 'react';
import { Badge, Popover, Typography, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

const { Text } = Typography;

// Тип уведомления с сервера
interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBell = () => {
  const user = useAuthStore((s) => s.user); // текущий пользователь
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0); // количество непрочитанных
  const [open, setOpen] = useState(false); // открыт ли поповер

  // Запрос непрочитанных уведомлений
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/notifications');
      setNotifications(data);
      setUnreadCount(data.length);
    } catch (err) {
      // тихо игнорируем ошибки, чтобы не мешать пользователю
    }
  };

  // Первый запрос при монтировании и далее опрос каждые 10 секунд
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Отметить все уведомления как прочитанные
  const handleMarkAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    if (ids.length === 0) return;
    try {
      await apiClient.post('/notifications/read', { ids });
      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      // тихо
    }
  };

  // Содержимое поповера (список уведомлений)
  const content = (
    <div style={{ maxWidth: 300 }}>
      {notifications.length === 0 ? (
        <Text type="secondary">Нет новых уведомлений</Text>
      ) : (
        <>
          {notifications.map((item) => (
            <div key={item.id} style={{ padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <Text>{item.message}</Text>
            </div>
          ))}
          <Button type="link" onClick={handleMarkAllRead}>
            Прочитать все
          </Button>
        </>
      )}
    </div>
  );

  // Неавторизованным колокольчик не показываем
  if (!user) return null;

  return (
    <Popover
      content={content}
      title="Уведомления"
      trigger="click"
      open={open}
      onOpenChange={setOpen}
    >
      <Badge count={unreadCount} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 20, cursor: 'pointer', color: '#fff' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;