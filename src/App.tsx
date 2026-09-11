import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./app/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import { ToastProvider } from "./context/ToastContext";
import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { CartPage, OrderOkPage } from "./features/cart/CartPage";
import { CatalogPage } from "./features/catalog/CatalogPage";
import { CreatePage } from "./features/custom/CreatePage";
import { HomePage } from "./features/home/HomePage";
import { ProductPage } from "./features/product/ProductPage";

export function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalogo" element={<CatalogPage />} />
                <Route path="/cds" element={<CatalogPage presetFormat="CD" />} />
                <Route path="/vinilos" element={<CatalogPage presetFormat="VINYL" />} />
                <Route path="/productos/:id" element={<ProductPage />} />
                <Route path="/crear" element={<CreatePage />} />
                <Route path="/carrito" element={<CartPage />} />
                <Route path="/pedido/ok" element={<OrderOkPage />} />
                <Route path="/iniciar-sesion" element={<LoginPage />} />
                <Route path="/registro" element={<RegisterPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}
