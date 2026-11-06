import { apiClient } from "../apiClient";
import type {
  BackendOrder,
  BackendUser,
  BackendUserPreference,
  BackendUserProfileResponse,
} from "../types";

export interface UpdateProfileDto {
  name?: string;
  phone?: string;
  avatar_url?: string;
}

export interface UpdatePasswordDto {
  current_password: string;
  new_password: string;
}

export interface UpdatePreferencesDto {
  phone?: string | null;
  preferred_format?: string;
  theme?: string;
  notify_order_status?: boolean;
  notify_newsletter?: boolean;
  default_address_line1?: string | null;
  default_address_line2?: string | null;
  default_city?: string | null;
  default_state?: string | null;
  default_postal_code?: string | null;
  default_country?: string;
  avatar_url?: string | null;
}

export const userService = {
  /**
   * Obtiene el perfil completo, preferencias y estadísticas de compras del usuario autenticado.
   */
  getProfile: async (): Promise<BackendUserProfileResponse> => {
    return apiClient.get<BackendUserProfileResponse>("/users/profile");
  },

  /**
   * Actualiza el nombre, teléfono y/o avatar del usuario.
   */
  updateProfile: async (
    dto: UpdateProfileDto
  ): Promise<{ message: string; user: BackendUser; preferences: BackendUserPreference }> => {
    return apiClient.put<{ message: string; user: BackendUser; preferences: BackendUserPreference }>(
      "/users/profile",
      dto
    );
  },

  /**
   * Modifica la contraseña del usuario validando la actual.
   */
  updatePassword: async (dto: UpdatePasswordDto): Promise<{ message: string }> => {
    return apiClient.put<{ message: string }>("/users/password", dto);
  },

  /**
   * Actualiza las direcciones de entrega y configuraciones generales del usuario.
   */
  updatePreferences: async (
    dto: UpdatePreferencesDto
  ): Promise<{ message: string; preferences: BackendUserPreference }> => {
    return apiClient.put<{ message: string; preferences: BackendUserPreference }>(
      "/users/preferences",
      dto
    );
  },

  /**
   * Consulta el historial completo de pedidos del usuario autenticado.
   */
  getOrders: async (): Promise<BackendOrder[]> => {
    const data = await apiClient.get<{ orders: BackendOrder[] }>("/users/orders");
    return data.orders || [];
  },
};
