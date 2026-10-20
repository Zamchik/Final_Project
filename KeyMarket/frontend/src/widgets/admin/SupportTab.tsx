import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Drawer, message } from 'antd';
import apiClient from '@/shared/api/client';
import { ChatWidget } from '@/widgets/Chat';
import { useAuthStore } from '@/entities/user/model/authStore';

interface Ticket {
  id: number;
  userId: number;
  user: { id: number; email: string };
  unreadAdmin: number;
  updatedAt: string;
  lastMessage?: string;
}

const SupportTab = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const user = useAuthStore((s) => s.user);

  const fetchTickets = useCallback(async () => {
    try {
      // Получить все SUPPORT-тикеты (только для админов)
      const { data } = await apiClient.get('/admin/chat/tickets');
      setTickets(data);
    } catch {
      message.error('Ошибка загрузки тикетов');
    }
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  const openChat = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setDrawerVisible(true);
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Пользователь', dataIndex: ['user', 'email'], key: 'user' },
    { title: 'Непрочитано', dataIndex: 'unreadAdmin', key: 'unread' },
    { title: 'Последнее обновление', dataIndex: 'updatedAt', key: 'updated', render: (d: string) => new Date(d).toLocaleString() },
    {
      title: 'Действие', key: 'action', render: (_: any, record: Ticket) => (
        <Button type="link" onClick={() => openChat(record)}>Открыть чат</Button>
      )
    },
  ];

  return (
    <div>
      <h2>Тикеты поддержки</h2>
      <Table columns={columns} dataSource={tickets} rowKey="id" />
      <Drawer
        title={`Чат с ${selectedTicket?.user?.email || 'пользователем'}`}
        open={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        width={450}
        destroyOnHidden
      >
        {selectedTicket && (
          <ChatWidget
            key={selectedTicket.id}
            type="SUPPORT"
            conversationId={selectedTicket.id}
            currentUserId={user!.id}
            currentUserRole={user!.role}
            userId={selectedTicket.userId ?? undefined}
          />
        )}
      </Drawer>
    </div>
  );
};

export default SupportTab;