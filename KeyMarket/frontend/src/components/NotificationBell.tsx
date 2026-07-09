// Компонент "Колокольчик" для отображения уведомлений
import { useEffect, useState, useCallback } from 'react';
import { Badge, Popover, Typography, Button } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import apiClient from '../api/client';
import { useAuthStore } from '../stores/authStore';

const { Text } = Typography;

interface Notification {
  id: number;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationBell = () => {
  const user = useAuthStore((s) => s.user);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await apiClient.get('/notifications');
      // Гарантируем, что работаем с массивом
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      setUnreadCount(list.length);
    } catch {
      // Игнорируем ошибки, чтобы не мешать интерфейсу
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    const ids = notifications.map((n) => n.id);
    try {
      await apiClient.post('/notifications/read', { ids });
      // Локально очищаем список
      setNotifications([]);
      setUnreadCount(0);
    } catch { 
      // Игнорируем ошибки, чтобы не мешать интерфейсу
    }
  };

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
        <BellOutlined style={{ fontSize: 28, cursor: 'pointer', color: '#fff' }} />
      </Badge>
    </Popover>
  );
};

export default NotificationBell;