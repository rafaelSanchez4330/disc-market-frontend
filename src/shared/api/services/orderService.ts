import { apiClient } from "../apiClient";
import type { BackendCheckoutResponse, BackendOrder } from "../types";

export interface CheckoutDto {
  userId?: number;
  paymentMethod?: string;
  shippingMethod?: string;
  shippingAddress?: string;
}

export const orderService = {
  /**
   * Procesa la compra convirtiendo el carrito activo en una orden real en PostgreSQL.
   */
  checkout: async (dto: CheckoutDto): Promise<BackendCheckoutResponse> => {
    return apiClient.post<BackendCheckoutResponse>("/orders/checkout", {
      user_id: dto.userId,
      payment_method: dto.paymentMethod || "credit_card",
      shipping_method: dto.shippingMethod || "Standard Delivery",
      shipping_address: dto.shippingAddress || "Dirección de prueba",
    });
  },

  /**
   * Consulta el detalle y estado de una orden por su ID.
   */
  getById: async (orderId: number): Promise<BackendOrder> => {
    return apiClient.get<BackendOrder>(`/orders/${orderId}`);
  },
};
