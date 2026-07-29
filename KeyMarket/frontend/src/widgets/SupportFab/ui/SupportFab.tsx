import { useState } from 'react';
import { Button } from 'antd';
import { CustomerServiceOutlined, CloseOutlined } from '@ant-design/icons';
import { ChatWidget } from '@/widgets/Chat';
import { useAuthStore } from '@/entities/user/model/authStore';

const SupportFab = () => {
  const [visible, setVisible] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (!user) return null;

  return (
    <>
      {/* Кнопка поддержки */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <Button
          type="primary"
          shape="circle"
          size="large"
          icon={
            visible ? (
              <CloseOutlined style={{ fontSize: 24 }} />
            ) : (
              <CustomerServiceOutlined style={{ fontSize: 24 }} />
            )
          }
          style={{
            width: 56,
            height: 56,
            boxShadow: '0 4px 12px rgba(114, 46, 209, 0.4)',
          }}
          onClick={() => setVisible(!visible)}
        />
      </div>

      {/* Всплывающее окно чата */}
      {visible && (
        <div
          style={{
            position: 'fixed',
            bottom: 90,
            right: 30,
            width: 380,
            height: 500,
            backgroundColor: '#1f1f1f',
            borderRadius: 12,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            zIndex: 999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1px solid #333',
          }}
        >
          {/* Заголовок */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #333',
              background: '#141414',
            }}
          >
            <span style={{ fontWeight: 500, color: '#fff', fontSize: 16 }}>
              Чат с поддержкой
            </span>
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setVisible(false)}
              style={{ color: '#b0b0b0' }}
              size="small"
            />
          </div>

          {/* Контент чата */}
          <div style={{ flex: 1, padding: 16, overflow: 'hidden' }}>
            <ChatWidget
              type="SUPPORT"
              currentUserId={user.id}
              currentUserRole={user.role}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default SupportFab;