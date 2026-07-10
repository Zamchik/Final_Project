import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CabinetPage from './pages/CabinetPage';
import LoginPage from './pages/registration/LoginPage';
import RegisterPage from './pages/registration/RegisterPage';
import MyProductsPage from './pages/MyProductsPage';
import CreateEditProductPage from './pages/CreateEditProductPage';
import AdminPage from './pages/AdminPage';
import SellPage from './pages/SellPage';
import WishlistPage from './pages/WishlistPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';

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