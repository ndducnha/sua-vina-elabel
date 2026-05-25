import { getRuntimeApiBaseUrl } from "@/lib/runtime-config";

export const API_BASE_URL = getRuntimeApiBaseUrl();

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/auth/login",
    LOGIN_GS1: "/auth/gs1-login",
    REGISTER: "/auth/register",
    BUSINESS_EXISTS: "/auth/business/exists",
    LOGOUT: "/auth/logout",
    REFRESH_TOKEN: "/auth/refresh",
    FORGOT_PASSWORD: "/auth/forgot-password",
    OTP_SEND: "/auth/otp/send",
    OTP_VERIFY: "/auth/otp/verify",
    CHECK_PASSWORD: "/auth/check-password",
    RESET_PASSWORD: "/auth/reset-password",
  },
  PRODUCTS: {
    LIST: "/products",
    DETAIL: (id: string) => `/products/${id}`,
    STATUS: (id: string) => `/products/${id}/status`,
    GROUPS: "/product-groups",
    BY_GTIN: "/products/nbc-by-gtin",
    BY_CODE: "/products/by-code",
    BATCHES: "/product-batches",
    PRODUCT_BATCHES: (productId: string, batchId?: string) => `/products/${productId}/batches${batchId ? `/${batchId}` : ""}`,
    PRODUCT_BATCHES_BULK_STATUS: (productId: string) =>
      `/products/${productId}/batches/bulk/status`,
    PRODUCT_BATCHES_BULK_DELETE: (productId: string) =>
      `/products/${productId}/batches/bulk/delete`,
    PRODUCT_BATCHES_BULK_QR_JOB: (productId: string) =>
      `/products/${productId}/batches/bulk/qr-job`,
    PRODUCT_BATCH_STATUS: (productId: string, batchId: string) => `/products/${productId}/batches/${batchId}/status`,
    PRODUCT_BATCH_BY_CODE: (productId: string) => `/products/${productId}/batches/by-code`,
  },
  FIELDS: {
    LIST: "/fields",
  },
  CLASSIFICATION: {
    SEGMENT: "/segments",
    CATEGORY: "/families",
    SUB_CATERGORY: "/classes",
    BRICK: "/bricks",
    RISK_FIELDS: "/risk-fields",
  },
  USERS: {
    ME: "/users/me",
    LIST: "/users",
    DETAIL: (id: string) => `/users/${id}`,
    CREATE: "/users",
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  QR_JOBS: {
    STATUS: (jobId: string) => `/qr-jobs/${jobId}`,
  },
} as const;
