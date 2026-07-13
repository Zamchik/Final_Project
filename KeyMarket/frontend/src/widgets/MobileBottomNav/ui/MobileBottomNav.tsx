// Нижняя панель навигации для мобильных устройств.
// Содержит иконки: Каталог, Избранное, Заказы, Профиль/Войти,
// а для продавца — Мои товары, Создать, для админа — Админ-панель.
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge, message } from 'antd';
import {
  AppstoreOutlined,
  HeartOutlined,
  ShoppingCartOutlined,
  PlusSquareOutlined,
  ShopOutlined,
  DashboardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/entities/user/model/authStore';
import { useWishlistStore } from '@/entities/product/model/wishlistStore';

const MobileBottomNav = () => {
  const user = useAuthStore((s) => s.user);
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, tab?: string) => {
    if (path === '/cabinet' && tab) {
      const currentTab = new URLSearchParams(location.search).get('tab');
      return location.pathname === '/cabinet' && currentTab === tab;
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const iconStyle = (path: string, tab?: string) => ({
    fontSize: 22,
    color: isActive(path, tab) ? '#722ed1' : '#b0b0b0',
  });

  const handleClick = (path: string) => {
    if (!user && path !== '/') {
      message.info('Войдите, чтобы продолжить');
      navigate('/login');
      return;
    }
    navigate(path);
  };

  return (
    <div
      className="mobile-bottom-nav"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 56,
        background: '#141414',
        borderTop: '1px solid #303030',
        justifyContent: 'space-evenly',
        alignItems: 'center',
        zIndex: 1000,
        padding: '0 4px',
      }}
    >
      <div onClick={() => navigate('/catalog')} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <AppstoreOutlined style={iconStyle('/catalog')} />
      </div>

      {user?.role === 'SELLER' && (
        <>
          <div onClick={() => handleClick('/my-products')} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <ShopOutlined style={iconStyle('/my-products')} />
          </div>
          <div onClick={() => handleClick('/create-product')} style={{ textAlign: 'center', cursor: 'pointer' }}>
            <PlusSquareOutlined style={iconStyle('/create-product')} />
          </div>
        </>
      )}

      {(user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
        <div onClick={() => handleClick('/admin')} style={{ textAlign: 'center', cursor: 'pointer' }}>
          <DashboardOutlined style={iconStyle('/admin')} />
        </div>
      )}

      <div onClick={() => handleClick('/wishlist')} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <Badge count={wishlistCount} size="small" offset={[4, -2]}>
          <HeartOutlined style={iconStyle('/wishlist')} />
        </Badge>
      </div>

      <div onClick={() => handleClick('/cabinet?tab=purchases')} style={{ textAlign: 'center', cursor: 'pointer' }}>
        <ShoppingCartOutlined style={iconStyle('/cabinet', 'purchases')} />
      </div>

      <div
        onClick={() => (user ? navigate('/cabinet?tab=profile') : navigate('/login'))}
        style={{ textAlign: 'center', cursor: 'pointer' }}
      >
        <UserOutlined style={iconStyle('/cabinet', 'profile')} />
      </div>
    </div>
  );
};

export default MobileBottomNav;