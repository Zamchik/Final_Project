// корневой компонент с маршрутами.
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/HomePage/HomePage';
import CatalogPage from '@/pages/CatalogPage/CatalogPage';
import ProductPage from '@/pages/ProductPage/ProductPage';
import CabinetPage from '@/pages/CabinetPage/CabinetPage';
import LoginPage from '@/pages/LoginPage/LoginPage';
import RegisterPage from '@/pages/RegisterPage/RegisterPage';
import MyProductsPage from '@/pages/MyProductsPage/MyProductsPage';
import CreateEditProductPage from '@/pages/CreateEditProductPage/CreateEditProductPage';
import AdminPage from '@/pages/AdminPage/AdminPage';
import SellPage from '@/pages/SellPage/SellPage';
import WishlistPage from '@/pages/WishlistPage/WishlistPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage/ForgotPasswordPage';
import ResetPasswordPage from '@/pages/ResetPasswordPage/ResetPasswordPage';     
import MainLayout from '@/widgets/Layout/ui/Layout';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/my-products" element={<MyProductsPage />} />
        <Route path="/create-product" element={<CreateEditProductPage />} />
        <Route path="/edit-product/:id" element={<CreateEditProductPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/sell" element={<SellPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
    </Routes>
  );
}

export default App;