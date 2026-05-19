import { Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu } from 'antd';
import { Link } from 'react-router-dom';

const { Header, Content, Footer } = AntLayout;

const items = [
  { key: 'home', label: <Link to="/">Главная</Link> },
  { key: 'catalog', label: <Link to="/catalog">Каталог</Link> },
  { key: 'cabinet', label: <Link to="/cabinet">Личный кабинет</Link> },
];

const MainLayout = () => {
  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Header>
        <Menu theme="dark" mode="horizontal" items={items} />
      </Header>
      <Content style={{ padding: '20px' }}>
        <Outlet />
      </Content>
      <Footer style={{ textAlign: 'center' }}>KeyMarket ©2026</Footer>
    </AntLayout>
  );
};

export default MainLayout;