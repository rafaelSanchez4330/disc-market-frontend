import { apiClient, tokenStorage } from "../apiClient";
import type { BackendAuthResponse } from "../types";

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  new_password: string;
}

export interface RequestOtpDto {
  email: string;
}

export interface VerifyOtpDto {
  email: string;
  code: string;
}

export const authRecoveryService = {
  /**
   * Solicita el envío de un correo con enlace de recuperación de contraseña.
   */
  forgotPassword: async (dto: ForgotPasswordDto): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/forgot-password", dto);
  },

  /**
   * Restablece la contraseña con el token criptográfico recibido por correo.
   */
  resetPassword: async (dto: ResetPasswordDto): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>("/auth/reset-password", dto);
  },

  /**
   * Solicita un código OTP de 6 dígitos al correo electrónico.
   */
  requestOtp: async (dto: RequestOtpDto): Promise<{ message: string; expiresIn: number }> => {
    return apiClient.post<{ message: string; expiresIn: number }>("/auth/otp/request", dto);
  },

  /**
   * Verifica el código OTP de 6 dígitos e inicia sesión en la plataforma.
   */
  verifyOtp: async (dto: VerifyOtpDto): Promise<BackendAuthResponse> => {
    const data = await apiClient.post<BackendAuthResponse>("/auth/otp/verify", dto);
    if (data.token) {
      tokenStorage.set(data.token);
    }
    return data;
  },
};
