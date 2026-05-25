import axiosInstance from "@/api/interceptors/axios-instance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type { ApiEnvelope } from "@/models/api.model";
import {
  parseUserRole,
  type AuthTokensData,
  type LoginRequest,
  type RegisterRequestBody,
  type User,
  type ResetPasswordRequestBody,
  UserMode,
} from "@/models/auth.model";

export function submitLogin(body: LoginRequest) {
  return axiosInstance.post<ApiEnvelope<AuthTokensData>>(API_ENDPOINTS.AUTH.LOGIN, body);
}
export function submitLoginGS1(body: LoginRequest) {
  return axiosInstance.post<ApiEnvelope<AuthTokensData>>(API_ENDPOINTS.AUTH.LOGIN_GS1, body);
}

export function submitRegister(body: RegisterRequestBody) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.REGISTER, body);
}

export type BusinessTaxCodeExistsData = { exists: boolean };

/** GET /auth/business/exists — pre-check registration (no auth). */
export function fetchBusinessExistsByTaxCode(taxCode: string) {
  return axiosInstance.get<ApiEnvelope<BusinessTaxCodeExistsData>>(
    API_ENDPOINTS.AUTH.BUSINESS_EXISTS,
    {
      params: { tax_code: taxCode },
      skipGlobalErrorToast: true,
    },
  );
}

export function submitForgetPassword(body: { email: string }) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, body);
}

export function submitOtpSend(body: { phone: string }) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.OTP_SEND, body);
}

export function submitOtpVerify(body: { otp: string; phone: string }) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.OTP_VERIFY, body);
}

export function submitCheckPassword(body: ResetPasswordRequestBody) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.CHECK_PASSWORD, body);
}

export function submitResetPassword(body: ResetPasswordRequestBody) {
  return axiosInstance.post<unknown>(API_ENDPOINTS.AUTH.RESET_PASSWORD, body);
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await axiosInstance.get<ApiEnvelope<User>>(API_ENDPOINTS.USERS.ME);
  const u = data.data;
  const role = parseUserRole(u.role);
  const mode = u.is_gs1_user ? UserMode.VNPC : UserMode.INTERNAL;
  if (role === null) {
    throw new Error("Invalid user role from API");
  }
  return { ...u, role, mode };
}
