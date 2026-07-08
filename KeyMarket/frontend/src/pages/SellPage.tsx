// frontend/src/pages/SellPage.tsx

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Typography, Button, Row, Col, Card, Modal, Input, message } from 'antd';
import {
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  PercentageOutlined,
  RocketOutlined,
  ArrowRightOutlined,
  MailOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../stores/authStore';
import { AxiosError } from 'axios';

const { Title, Paragraph, Text } = Typography;

const SellPage = () => {
  const user = useAuthStore((s) => s.user);
  const requestSellerRole = useAuthStore((s) => s.requestSellerRole);
  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState<{ verificationUrl: string; previewUrl: string | null } | null>(null);

  // Обработчик нажатия на основную кнопку в зависимости от роли
  const handlePrimaryAction = () => {
    if (!user) {
      navigate('/register');
    } else if (user.role === 'BUYER') {
      setIsModalOpen(true);
      setResultData(null);
      setPassword('');
    } else if (user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      navigate('/create-product');
    }
  };

  // Отправка запроса на получение роли продавца
  const handleSubmitPassword = async () => {
    if (!password.trim()) {
      message.warning('Введите пароль');
      return;
    }
    setLoading(true);
    try {
      const data = await requestSellerRole(password);
      setIsModalOpen(false);
      setResultData(data);
      // Покажем модальное окно с результатом и ссылкой на Ethereal
    } catch (err) {
      const error = err as AxiosError<{ error: string }>;
      message.error(error.response?.data?.error || 'Ошибка подтверждения');
    } finally {
      setLoading(false);
    }
  };

  // Какую кнопку показывать под преимуществами
  const renderPrimaryButton = () => {
    if (!user) {
      return (
        <Link to="/register">
          <Button type="primary" size="large" style={buttonStyle}>
            Зарегистрироваться и начать продавать <ArrowRightOutlined />
          </Button>
        </Link>
      );
    }
    if (user.role === 'BUYER') {
      return (
        <Button type="primary" size="large" style={buttonStyle} onClick={handlePrimaryAction}>
          Стать продавцом <ArrowRightOutlined />
        </Button>
      );
    }
    if (user.role === 'SELLER' || user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return (
        <Button type="primary" size="large" style={buttonStyle} onClick={handlePrimaryAction}>
          Создать товар <ArrowRightOutlined />
        </Button>
      );
    }
    return null;
  };

  const buttonStyle = {
    background: '#722ed1',
    borderColor: '#722ed1',
    height: 48,
    paddingLeft: 40,
    paddingRight: 40,
    fontSize: 16,
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 16px' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: 40 }}>
        Почему стоит продавать на KeyMarket
      </Title>
      <Row gutter={[24, 24]}>
        {[
          {
            icon: <PercentageOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Низкая комиссия',
            text: 'Продавайте с комиссией всего 5% — это выгоднее, чем у конкурентов.',
          },
          {
            icon: <ThunderboltOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Мгновенное зачисление',
            text: 'Средства от продажи поступают на ваш счёт сразу после оплаты.',
          },
          {
            icon: <SafetyCertificateOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Гарантия безопасности',
            text: 'Платформа резервирует деньги покупателя до выдачи ключа.',
          },
          {
            icon: <RocketOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
            title: 'Быстрый старт',
            text: 'Зарегистрируйтесь за минуту и начните продавать прямо сейчас.',
          },
        ].map((item) => (
          <Col xs={24} sm={12} key={item.title}>
            <Card hoverable style={{ textAlign: 'center', height: '100%' }}>
              <div style={{ marginBottom: 16 }}>{item.icon}</div>
              <Title level={4}>{item.title}</Title>
              <Paragraph type="secondary">{item.text}</Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
      <div style={{ textAlign: 'center', marginTop: 48 }}>
        {renderPrimaryButton()}
        <Paragraph type="secondary" style={{ marginTop: 16 }}>
          {!user
            ? 'Зарегистрируйтесь и начните зарабатывать уже сегодня.'
            : user.role === 'BUYER'
            ? 'Подтвердите свою личность и начните продавать.'
            : 'Перейдите к созданию вашего первого товара.'}
        </Paragraph>
      </div>

      {/* Модалка ввода пароля */}
      <Modal
        title="Подтверждение личности"
        open={isModalOpen}
        onOk={handleSubmitPassword}
        onCancel={() => setIsModalOpen(false)}
        confirmLoading={loading}
        okText="Подтвердить"
        cancelText="Отмена"
      >
        <p>Для получения статуса продавца введите ваш текущий пароль.</p>
        <Input.Password
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onPressEnter={handleSubmitPassword}
        />
      </Modal>

      {/* Модалка с результатом */}
      <Modal
        title="Письмо отправлено"
        open={!!resultData}
        onOk={() => setResultData(null)}
        onCancel={() => setResultData(null)}
        okText="Понятно"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        <p>На ваш email отправлена ссылка для подтверждения статуса продавца.</p>
        {resultData?.verificationUrl && (
          <div style={{ marginBottom: 16 }}>
            <Text copyable style={{ wordBreak: 'break-all' }}>{resultData.verificationUrl}</Text>
          </div>
        )}
        {resultData?.previewUrl && (
          <Button
            type="link"
            icon={<MailOutlined />}
            onClick={() => window.open(resultData.previewUrl!, '_blank')}
          >
            Открыть письмо в Ethereal
          </Button>
        )}
      </Modal>
    </div>
  );
};

export default SellPage;