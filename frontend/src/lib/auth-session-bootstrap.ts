import { fetchCurrentUser } from "@/api/auth";
import { requestTokenRefresh } from "@/api/interceptors/axios-instance";
import { useAuthStore } from "@/stores/auth.store";

let bootstrapInFlight: Promise<void> | null = null;

/**
 * After persist rehydration: never trust a persisted access token — keep it memory-only.
 * If we only have a refresh token, exchange it once for a new pair (rotation-friendly).
 * Deduplicated so React Strict Mode / double effects do not rotate twice in parallel.
 */
export function bootstrapAuthFromPersistedRefresh(): Promise<void> {
  if (!bootstrapInFlight) {
    bootstrapInFlight = (async () => {
      useAuthStore.setState({ accessToken: null });

      const { refreshToken } = useAuthStore.getState();
      if (!refreshToken) return;

      try {
        const tokens = await requestTokenRefresh(refreshToken);
        useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token);
        try {
          const user = await fetchCurrentUser();
          useAuthStore.getState().setUser(user);
        } catch {
          /* giữ snapshot user đã persist nếu /users/me lỗi tạm thời */
        }
      } catch {
        useAuthStore.getState().logout();
      }
    })().finally(() => {
      bootstrapInFlight = null;
    });
  }

  return bootstrapInFlight;
}
