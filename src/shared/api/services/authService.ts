import { apiClient, tokenStorage } from "../apiClient";
import type { BackendAuthResponse, BackendUser } from "../types";

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
}

export const authService = {
  /**
   * Inicia sesión con correo y contraseña.
   */
  login: async (credentials: LoginDto): Promise<BackendAuthResponse> => {
    const data = await apiClient.post<BackendAuthResponse>("/auth/login", credentials);
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  /**
   * Registra una nueva cuenta de cliente.
   */
  register: async (dto: RegisterDto): Promise<BackendAuthResponse> => {
    const data = await apiClient.post<BackendAuthResponse>("/auth/register", dto);
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },

  /**
   * Obtiene la información del usuario autenticado actual a partir del token JWT.
   */
  getMe: async (): Promise<BackendUser> => {
    const data = await apiClient.get<{ user: BackendUser }>("/auth/me");
    return data.user;
  },

  /**
   * Cierra la sesión activa y elimina el token del almacenamiento local.
   */
  logout: (): void => {
    tokenStorage.clear();
  },
};
