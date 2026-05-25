import "axios";

/**
 * Per-request options for `axios-instance.ts` in this folder.
 * Keep in sync with `showApiError` / response interceptor.
 */
declare module "axios" {
  export interface AxiosRequestConfig {
    /**
     * When true, failed responses will not trigger the global `toast.error` (e.g. expected 404
     * or errors handled inline by the caller).
     */
    skipGlobalErrorToast?: boolean;
  }
}
