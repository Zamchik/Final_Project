import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/Layout';
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductPage from './pages/ProductPage';
import CabinetPage from './pages/CabinetPage';

function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
        <Route path="/cabinet" element={<CabinetPage />} />
      </Route>
    </Routes>
  );
}

export default App;