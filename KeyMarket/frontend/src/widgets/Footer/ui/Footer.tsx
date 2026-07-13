// Футер приложения с информационными ссылками и соцсетями.
import { Link } from 'react-router-dom';
import { Layout, Row, Col, Typography, Divider } from 'antd';
import { GithubOutlined, TwitterOutlined, InstagramOutlined, YoutubeOutlined } from '@ant-design/icons';

const { Footer: AntFooter } = Layout;
const { Title, Text } = Typography;

const FooterWidget = () => {
  return (
    <AntFooter
      className="desktop-footer"
      style={{
        background: 'linear-gradient(180deg, #141414 0%, #0d0d0d 100%)',
        padding: '48px 32px 24px',
        color: '#b0b0b0',
        borderTop: '1px solid #333',
      }}
    >
      <Row gutter={[32, 32]} justify="center" style={{ maxWidth: 1400, margin: '0 auto' }}>
        <Col xs={24} sm={6}>
          <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>
            <span style={{ color: '#722ed1' }}>Key</span>Market
          </Title>
          <Text type="secondary">Маркетплейс цифровых товаров. Безопасные сделки, мгновенная выдача ключей, низкая комиссия 5%.</Text>
          <div style={{ marginTop: 16, display: 'flex', gap: 12, fontSize: 24 }}>
            <GithubOutlined />
            <TwitterOutlined />
            <InstagramOutlined />
            <YoutubeOutlined />
          </div>
        </Col>
        <Col xs={24} sm={6}>
          <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Покупателям</Title>
          <Link to="/catalog" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Каталог</Link>
          <Link to="/catalog?sort=newest" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Новинки</Link>
          <Link to="/catalog?sort=price_desc" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Популярное</Link>
          <Link to="/catalog?productType=GAME" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Игры</Link>
          <Link to="/catalog?productType=DLC" style={{ color: '#b0b0b0', display: 'block' }}>Дополнения (DLC)</Link>
        </Col>
        <Col xs={24} sm={6}>
          <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Продавцам</Title>
          <Link to="/sell" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Начать продавать</Link>
          <Link to="/create-product" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Добавить товар</Link>
          <Link to="/my-products" style={{ color: '#b0b0b0', display: 'block', marginBottom: 8 }}>Мои товары</Link>
          <Link to="/cabinet?tab=profile" style={{ color: '#b0b0b0', display: 'block' }}>Вывод средств</Link>
        </Col>
        <Col xs={24} sm={6}>
          <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>Поддержка</Title>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>Есть вопросы?</Text>
          <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>support@keymarket.local</Text>
          <Text type="secondary" style={{ display: 'block' }}>Пн–Пт 10:00–19:00 МСК</Text>
        </Col>
      </Row>
      <Divider style={{ borderColor: '#333', marginTop: 32, marginBottom: 16 }} />
      <div style={{ textAlign: 'center', maxWidth: 1400, margin: '0 auto' }}>
        <Text type="secondary" style={{ fontSize: 13 }}>© 2026 KeyMarket. Все права защищены.</Text>
      </div>
    </AntFooter>
  );
};

export default FooterWidget;