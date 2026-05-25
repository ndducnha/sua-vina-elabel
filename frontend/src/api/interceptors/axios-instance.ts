import axios, {
  AxiosHeaders,
  isAxiosError,
  isCancel,
  type AxiosError,
} from "axios";
import { toast } from "sonner";
import i18n from "@/i18n";
import { logoutAndRedirectToLogin } from "@/lib/auth-logout";
import { useAuthStore } from "@/stores/auth.store";
import type { ApiEnvelope } from "@/models/api.model";
import type { AuthTokensData } from "@/models/auth.model";
import { API_BASE_URL, API_ENDPOINTS } from "../endpoints";
import { STATIC_MODE, staticAdapter } from "@/lib/static-mode";

/**
 * Paths do not show global error toast.
 * Add/remove path here.
 */
const SKIP_GLOBAL_ERROR_TOAST_URLS = new Set<string>([
  API_ENDPOINTS.USERS.ME,
  API_ENDPOINTS.AUTH.REFRESH_TOKEN,
]);

const GLOBAL_ERROR_TOAST_FALLBACK = "Something went wrong";

function messageFromApiErrorBody(error: AxiosError): string {
  const data = error.response?.data as { message?: string } | undefined;
  return (data?.message ?? "").trim();
}

function normalizeAxiosErrorMessage<TError>(error: TError): TError {
  if (!isAxiosError(error)) {
    return error;
  }

  const apiMessage = messageFromApiErrorBody(error);
  if (apiMessage) {
    error.message = apiMessage;
  }

  return error;
}

function showApiError(error: unknown): void {
  if (isAxiosError(error) && (isCancel(error) || error.code === "ERR_CANCELED")) {
    return;
  }
  if (!isAxiosError(error)) return;
  if (SKIP_GLOBAL_ERROR_TOAST_URLS.has(error.config?.url ?? "")) return;
  if (error.config?.skipGlobalErrorToast) return;

  const message =
    messageFromApiErrorBody(error) || GLOBAL_ERROR_TOAST_FALLBACK;
  toast.error(message);
}

/** API locale header — must be allowed in CORS `Access-Control-Allow-Headers` on the server. */
export const ACCEPT_LANGUAGE_HEADER = "Accept-Language";

/** Matches `LanguageSwitcher` / `localStorage` keys: `vi` | `en`. */
function xLanguageValue(): "vi" | "en" {
  const stored =
    typeof localStorage !== "undefined" ? localStorage.getItem("language") : null;
  const raw =
    stored || i18n.resolvedLanguage || i18n.language || "vi";
  const primary = raw.split("-")[0]?.toLowerCase() ?? "vi";
  return primary === "vi" ? "vi" : "en";
}

function applyXLanguageHeader(headers: AxiosHeaders): void {
  headers.set(ACCEPT_LANGUAGE_HEADER, xLanguageValue(), true);
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL + "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
  ...(STATIC_MODE ? { adapter: staticAdapter } : {}),
});

/** Plain axios call — avoids interceptor refresh loop. */
export async function requestTokenRefresh(
  refresh_token: string
): Promise<Pick<AuthTokensData, "access_token" | "refresh_token">> {
  const { data } = await axios.post<ApiEnvelope<AuthTokensData>>(
    `${API_BASE_URL}/api${API_ENDPOINTS.AUTH.REFRESH_TOKEN}`,
    { refresh_token },
    {
      headers: (() => {
        const h = new AxiosHeaders({ "Content-Type": "application/json" });
        applyXLanguageHeader(h);
        return h;
      })(),
      timeout: 15000,
    }
  );

  const payload = data.data;
  if (!payload.access_token || !payload.refresh_token) {
    throw new Error("Invalid token response: missing tokens");
  }

  return payload;
}

// Request interceptor – attach access token
axiosInstance.interceptors.request.use(
  (requestConfig) => {
    const headers = AxiosHeaders.from(requestConfig.headers);
    applyXLanguageHeader(headers);
    requestConfig.headers = headers;

    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      requestConfig.headers.Authorization = `Bearer ${accessToken}`;
    }
    return requestConfig;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – handle 401 / refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token!);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    normalizeAxiosErrorMessage(error);

    if (isAxiosError(error) && (isCancel(error) || error.code === "ERR_CANCELED")) {
      return Promise.reject(error);
    }

    const originalRequest = error.config;

    // If 401 and not already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url === API_ENDPOINTS.AUTH.REFRESH_TOKEN) {
        logoutAndRedirectToLogin();
        return Promise.reject(error);
      }

      if (
        originalRequest.url === API_ENDPOINTS.AUTH.LOGIN ||
        originalRequest.url === API_ENDPOINTS.AUTH.LOGIN_GS1 ||
        originalRequest.url === API_ENDPOINTS.AUTH.REGISTER
      ) {
        const apiMessage = messageFromApiErrorBody(error);
        const isLoginAttempt =
          originalRequest.url === API_ENDPOINTS.AUTH.LOGIN ||
          originalRequest.url === API_ENDPOINTS.AUTH.LOGIN_GS1;
        toast.error(
          apiMessage ||
            (isLoginAttempt
              ? i18n.t("auth.loginInvalidCredentials")
              : GLOBAL_ERROR_TOAST_FALLBACK),
        );
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          originalRequest.skipGlobalErrorToast = true;
          return axiosInstance(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const payload = await requestTokenRefresh(refreshToken);
        useAuthStore.getState().setTokens(payload.access_token, payload.refresh_token);
        processQueue(null, payload.access_token);

        originalRequest.headers.Authorization = `Bearer ${payload.access_token}`;
        originalRequest.skipGlobalErrorToast = true;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        normalizeAxiosErrorMessage(refreshError);
        processQueue(refreshError);
        logoutAndRedirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    showApiError(error);
    return Promise.reject(error);
  }
);

export default axiosInstance;
