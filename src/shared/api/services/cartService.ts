import { apiClient } from "../apiClient";
import type { BackendCartItem, BackendShoppingCart } from "../types";

export interface AddToCartDto {
  userId: number;
  productId?: number;
  customProductId?: number;
  quantity?: number;
}

export const cartService = {
  /**
   * Obtiene el carrito activo del usuario desde el backend.
   */
  getCart: async (userId: number): Promise<BackendShoppingCart> => {
    return apiClient.get<BackendShoppingCart>(`/cart/user/${userId}`);
  },

  /**
   * Agrega un producto regular o personalizado al carrito del usuario en la base de datos.
   */
  addItem: async (dto: AddToCartDto): Promise<BackendCartItem> => {
    return apiClient.post<BackendCartItem>("/cart/items", {
      user_id: dto.userId,
      product_id: dto.productId || null,
      custom_product_id: dto.customProductId || null,
      quantity: dto.quantity || 1,
    });
  },

  /**
   * Actualiza la cantidad de un ítem en el carrito.
   */
  updateQuantity: async (itemId: number, quantity: number): Promise<BackendCartItem> => {
    return apiClient.put<BackendCartItem>(`/cart/items/${itemId}`, { quantity });
  },

  /**
   * Elimina un ítem del carrito por su ID.
   */
  removeItem: async (itemId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/cart/items/${itemId}`);
  },

  /**
   * Vacía el carrito del usuario.
   */
  clearCart: async (userId: number): Promise<{ message: string }> => {
    return apiClient.delete<{ message: string }>(`/cart/user/${userId}/clear`);
  },
};
