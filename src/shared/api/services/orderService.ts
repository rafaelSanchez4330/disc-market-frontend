import { apiClient } from "../apiClient";
import type { BackendOrder } from "../types";

export const orderService = {
  /**
   * Consulta el detalle y estado de una orden por su ID.
   */
  getById: async (orderId: number): Promise<BackendOrder> => {
    return apiClient.get<BackendOrder>(`/orders/${orderId}`);
  },
};
