// ============================================================================
// Вкладка управления пользователями (админ-панель)
// Отображает список пользователей, позволяет банить/разбанивать, менять роль
// ============================================================================

import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Select, Input, Space, message, Popconfirm } from 'antd';
import apiClient from '../../api/client';
import { AxiosError } from 'axios';

interface UserItem {
  id: number;
  email: string;
  role: string;
  balance: string;
  is_banned: boolean;
  created_at: string;
}

const UsersTab = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // -------------------------------------------------------------------------
  // Загрузка списка пользователей с пагинацией и фильтрами
  // -------------------------------------------------------------------------
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, [fetchUsers]);

  // -------------------------------------------------------------------------
  // Бан / разбан пользователя
  // -------------------------------------------------------------------------
  const handleToggleBan = async (userId: number) => {
    try {
      await apiClient.put(`/admin/users/${userId}/ban`);
      message.success('Статус бана изменён');
      fetchUsers();
    } catch {
      message.error('Ошибка изменения бана');
    }
  };

  // -------------------------------------------------------------------------
  // Смена роли пользователя
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // Колонки таблицы
  // -------------------------------------------------------------------------
  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Роль', dataIndex: 'role', key: 'role' },
    { title: 'Баланс', dataIndex: 'balance', key: 'balance' },
    {
      title: 'Бан',
      dataIndex: 'is_banned',
      key: 'is_banned',
      render: (banned: boolean) => (banned ? 'Да' : 'Нет'),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: UserItem) => (
        <Space>
          <Popconfirm
            title={`${record.is_banned ? 'Разбанить' : 'Забанить'} пользователя?`}
            onConfirm={() => handleToggleBan(record.id)}
          >
            <Button type="link" danger={!record.is_banned}>
              {record.is_banned ? 'Разбанить' : 'Забанить'}
            </Button>
          </Popconfirm>
          <Select
            value={record.role}
            style={{ width: 120 }}
            onChange={(value) => handleChangeRole(record.id, value)}
            options={[
              { value: 'buyer', label: 'Покупатель' },
              { value: 'seller', label: 'Продавец' },
              { value: 'admin', label: 'Админ' },
            ]}
          />
        </Space>
      ),
    },
  ];

  // -------------------------------------------------------------------------
  // Рендер
  // -------------------------------------------------------------------------
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
            { value: 'buyer', label: 'Покупатели' },
            { value: 'seller', label: 'Продавцы' },
            { value: 'admin', label: 'Админы' },
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