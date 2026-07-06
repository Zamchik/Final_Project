// Вкладка управления пользователями (админ‑панель)
import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Select, Input, Space, message, Popconfirm } from 'antd';
import apiClient from '../../api/client';
import { AxiosError } from 'axios';
import { useAuthStore } from '../../stores/authStore';

interface UserItem {
  id: number;
  email: string;
  role: string;
  balance: string;
  bannedAt: string | null;
  createdAt: string;
}

const roleLabel = (role: string) => {
  switch (role) {
    case 'BUYER': return 'Покупатель';
    case 'SELLER': return 'Продавец';
    case 'ADMIN': return 'Администратор';
    case 'SUPER_ADMIN': return 'Супер‑админ';
    default: return role;
  }
};

const UsersTab = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const currentUser = useAuthStore((s) => s.user);

  // Загрузка списка пользователей
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/admin/users', {
        params: { page, limit: 20, search, role: roleFilter },
      });
      setUsers(data.users);
      setTotal(data.total);
    } catch {
      message.error('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Бан
  const handleBan = async (userId: number) => {
    try {
      await apiClient.put(`/admin/users/${userId}/ban`);
      message.success('Пользователь забанен');
      fetchUsers();
    } catch {
      message.error('Ошибка бана');
    }
  };

  // Разбан
  const handleUnban = async (userId: number) => {
    try {
      await apiClient.put(`/admin/users/${userId}/unban`);
      message.success('Пользователь разбанен');
      fetchUsers();
    } catch {
      message.error('Ошибка разбана');
    }
  };

  // Смена роли (отправляем значение в верхнем регистре)
  const handleChangeRole = async (userId: number, newRole: string) => {
    try {
      await apiClient.put(`/admin/users/${userId}/role`, { role: newRole });
      message.success('Роль изменена');
      fetchUsers();
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка смены роли');
    }
  };

  // Колонки таблицы
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => roleLabel(role),
    },
    { title: 'Баланс', dataIndex: 'balance', key: 'balance' },
    {
      title: 'Бан',
      dataIndex: 'bannedAt',
      key: 'bannedAt',
      render: (bannedAt: string | null) => (bannedAt ? 'Да' : 'Нет'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: UserItem) => (
        <Space>
          {/* Кнопки бана/разбана не показываются для SUPER_ADMIN */}
          {record.role !== 'SUPER_ADMIN' && (
            <>
              {record.bannedAt ? (
                <Popconfirm title="Разбанить пользователя?" onConfirm={() => handleUnban(record.id)}>
                  <Button type="link">Разбанить</Button>
                </Popconfirm>
              ) : (
                <Popconfirm title="Забанить пользователя?" onConfirm={() => handleBan(record.id)}>
                  <Button type="link" danger>Забанить</Button>
                </Popconfirm>
              )}
            </>
          )}

          {/* Выбор роли скрыт для SUPER_ADMIN */}
          {record.role !== 'SUPER_ADMIN' && (
            <Select
              value={record.role}
              style={{ width: 140 }}
              onChange={(value) => handleChangeRole(record.id, value)}
              options={[
                { value: 'BUYER', label: 'Покупатель' },
                { value: 'SELLER', label: 'Продавец' },
                { value: 'ADMIN', label: 'Администратор' },
                ...(currentUser?.role === 'SUPER_ADMIN'
                  ? [{ value: 'SUPER_ADMIN' as const, label: 'Супер‑админ' }]
                  : []),
              ]}
            />
          )}
        </Space>
      ),
    },
  ];

  // Рендер
  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Поиск по email"
          allowClear
          onSearch={setSearch}
          style={{ width: 300 }}
        />
        <Select
          placeholder="Фильтр по роли"
          allowClear
          value={roleFilter}
          onChange={setRoleFilter}
          options={[
            { value: 'BUYER', label: 'Покупатели' },
            { value: 'SELLER', label: 'Продавцы' },
            { value: 'ADMIN', label: 'Админы' },
            { value: 'SUPER_ADMIN', label: 'Супер‑админы' },
          ]}
          style={{ width: 150 }}
        />
      </Space>
      <Table
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => setPage(p),
        }}
      />
    </div>
  );
};

export default UsersTab;