import { apiClient } from "../apiClient";
import { mapBackendProduct } from "../mappers";
import type { BackendCategory, BackendProduct } from "../types";
import type { Product } from "../../../data/types";

export interface ProductFilters {
  [key: string]: string | number | boolean | undefined | null;
  format?: string;
  artist?: string;
  search?: string;
  category?: string;
  category_id?: number;
}

export const productService = {
  /**
   * Obtiene la lista de productos filtrada desde el backend y la mapea a la UI.
   */
  getProducts: async (filters: ProductFilters = {}): Promise<Product[]> => {
    const rawProducts = await apiClient.get<BackendProduct[]>("/products", filters);
    return rawProducts.map(mapBackendProduct);
  },

  /**
   * Obtiene el detalle de un producto por su ID.
   */
  getProductById: async (id: number): Promise<Product> => {
    const rawProduct = await apiClient.get<BackendProduct>(`/products/${id}`);
    return mapBackendProduct(rawProduct);
  },

  /**
   * Obtiene las categorías disponibles en la tienda.
   */
  getCategories: async (): Promise<BackendCategory[]> => {
    return apiClient.get<BackendCategory[]>("/categories");
  },
};
