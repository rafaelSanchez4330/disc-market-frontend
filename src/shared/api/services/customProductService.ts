import { apiClient } from "../apiClient";
import type { BackendCustomProduct } from "../types";

export interface CreateCustomProductDto {
  format: "CD" | "VINYL";
  title: string;
  message?: string;
  packaging?: "standard" | "gift" | "collector";
  price?: number;
  coverFile?: File | null;
  tracks?: Array<{ name: string; order: number }>;
}

export const customProductService = {
  /**
   * Crea un nuevo disco personalizado enviando carátula (FormData) y metadatos de pistas al backend.
   */
  create: async (dto: CreateCustomProductDto): Promise<BackendCustomProduct> => {
    const formData = new FormData();
    formData.append("format", dto.format);
    formData.append("title", dto.title || "Mi Disco Personalizado");
    if (dto.message) formData.append("message", dto.message);
    if (dto.packaging) formData.append("packaging_option", dto.packaging);
    if (dto.price) formData.append("price", dto.price.toString());

    if (dto.coverFile) {
      formData.append("cover", dto.coverFile);
    }

    if (dto.tracks && dto.tracks.length > 0) {
      formData.append("tracks", JSON.stringify(dto.tracks));
    }

    return apiClient.post<BackendCustomProduct>("/custom-products", formData);
  },

  /**
   * Consulta el detalle de un disco personalizado y sus pistas asociadas.
   */
  getById: async (id: number): Promise<BackendCustomProduct> => {
    return apiClient.get<BackendCustomProduct>(`/custom-products/${id}`);
  },
};
