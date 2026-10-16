import { apiClient } from "../apiClient";

export interface CreateIntentDto {
  userId?: number;
  shippingMethod?: string;
  shippingAddress?: string;
}

export interface CreateIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

export interface ConfirmPaymentResponse {
  message: string;
  order_id: number;
  total_amount: number;
  tracking_number: string;
}

export const paymentService = {
  /**
   * Crea un PaymentIntent en Stripe con el total calculado del carrito activo en la base de datos.
   */
  createIntent: async (dto: CreateIntentDto): Promise<CreateIntentResponse> => {
    return apiClient.post<CreateIntentResponse>("/payments/create-intent", {
      user_id: dto.userId,
      shipping_method: dto.shippingMethod,
      shipping_address: dto.shippingAddress,
    });
  },

  /**
   * Confirma la orden en el backend tras el cobro exitoso procesado por Stripe Elements.
   */
  confirm: async (paymentIntentId: string): Promise<ConfirmPaymentResponse> => {
    return apiClient.post<ConfirmPaymentResponse>("/payments/confirm", {
      paymentIntentId,
    });
  },
};
