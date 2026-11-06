import { apiClient } from '../apiClient';

export interface AdminPage<T> { items: T[]; total: number; page: number; limit: number }
export interface AdminSummary {
  revenue: number; paid_orders: number; total_orders: number; average_order: number;
  users: number; products: number; low_stock: number; currency: string;
}
export interface AdminProduct {
  product_id: number; name: string; artist: string; format: string; price: number;
  inventory: { quantity_available: number; quantity_reserved: number } | null;
}
export interface AdminUser {
  user_id: number; name: string; email: string; role: string; created_at: string;
  phone: string | null; order_count: number; total_spent: number;
}
export interface AdminOrder {
  order_id: number; total_amount: number; order_status: string; payment_status: string; created_at: string;
  user: { name: string; email: string } | null;
  payment: { payment_method: string; transaction_id: string | null } | null;
  shipping: { shipping_method: string; tracking_number: string | null; shipping_status: string } | null;
  order_items: { order_item_id: number; quantity: number; unit_price: number;
    product: { name: string } | null; custom_product: { title: string } | null }[];
}
type Filters = { page?: number; search?: string; from?: string; to?: string };
export const adminService = {
  summary: (filters: Filters) => apiClient.get<AdminSummary>('/admin/summary', filters),
  products: (filters: Filters) => apiClient.get<AdminPage<AdminProduct>>('/admin/products', filters),
  users: (filters: Filters) => apiClient.get<AdminPage<AdminUser>>('/admin/users', filters),
  orders: (filters: Filters) => apiClient.get<AdminPage<AdminOrder>>('/admin/orders', filters),
  addStock: (id: number, quantity: number) => apiClient.post(`/admin/products/${id}/stock`, { quantity }),
};
