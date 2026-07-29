// Универсальный виджет чата с WebSocket-поддержкой.
import { useEffect, useState, useRef } from 'react';
import { Input, Button, Typography, Space, message, Spin } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import apiClient from '@/shared/api/client';

const { Text } = Typography;

interface Message {
  id: number;
  senderId: number;
  text: string;
  createdAt: string;
  sender: { id: number; email: string };
}

interface ChatWidgetProps {
  type: 'ORDER' | 'SUPPORT';
  orderId?: number;
  buyerId?: number;
  sellerId?: number;
  userId?: number;
  conversationId?: number;
  currentUserId: number;
  currentUserRole: string;
}

const ChatWidget = ({
  type,
  orderId,
  buyerId,
  sellerId,
  userId,
  conversationId: initialConversationId,
  currentUserId,
  currentUserRole,
}: ChatWidgetProps) => {
  const [conversationId, setConversationId] = useState<number | null>(initialConversationId ?? null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Инициализация диалога и подключение WebSocket
  useEffect(() => {
    let ws: WebSocket | null = null;
    let cancelled = false;

    const initChat = async () => {
      try {
        let conv;
        if (initialConversationId) {
          conv = { id: initialConversationId };
        } else if (type === 'ORDER') {
          const { data } = await apiClient.post(`/chat/order/${orderId}`, {});
          conv = data;
        } else {
          const { data } = await apiClient.post('/chat/support', {});
          conv = data;
        }
        if (cancelled) return;

        setConversationId(conv.id);

        // Загружаем историю сообщений
        const { data: msgData } = await apiClient.get(`/chat/${conv.id}/messages`);
        setMessages(msgData.messages);

        // Подключаем WebSocket
        const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws?.send(JSON.stringify({ type: 'subscribe', conversationId: conv.id }));
        };

        ws.onmessage = (event: MessageEvent) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message') {
              setMessages((prev) => [...prev, payload.message]);
            }
          } catch {
            // игнорируем ошибки парсинга
          }
        };

        ws.onclose = () => {
          // Пытаемся переподключиться через 2 секунды, если компонент ещё жив
          setTimeout(() => {
            if (!cancelled && wsRef.current?.readyState === WebSocket.CLOSED) {
              initChat();
            }
          }, 2000);
        };
      } catch (err) {
        if (!cancelled) message.error('Не удалось загрузить чат');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    initChat();

    return () => {
      cancelled = true;
      ws?.close();
    };
  }, [type, orderId, initialConversationId]);

  // Автоскролл
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка сообщения
  const handleSend = async () => {
    if (!text.trim() || !conversationId) return;
    try {
      await apiClient.post(`/chat/${conversationId}/messages`, { text });
      setText('');
      // Сообщение появится через WS, когда сервер разошлёт new_message
    } catch (err) {
      message.error('Ошибка отправки');
    }
  };

  // Пометка прочитанным при фокусе окна
  useEffect(() => {
    if (!conversationId) return;
    const handleFocus = () => {
      apiClient.put(`/chat/${conversationId}/read`).catch(() => {});
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [conversationId]);

  if (loading) return <Spin />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 400 }}>
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 8,
          background: '#1a1a1a',
          borderRadius: 8,
          marginBottom: 8,
        }}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
              marginBottom: 12,
            }}
          >
            <Text type="secondary" style={{ fontSize: 12 }}>
              {msg.sender.email} • {new Date(msg.createdAt).toLocaleTimeString()}
            </Text>
            <div
              style={{
                background: msg.senderId === currentUserId ? '#722ed1' : '#2a2a2a',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: 12,
                maxWidth: '70%',
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onPressEnter={handleSend}
          placeholder="Введите сообщение..."
        />
        <Button type="primary" icon={<SendOutlined />} onClick={handleSend} />
      </Space.Compact>
    </div>
  );
};

export default ChatWidget;