import axios from "axios";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { API_BASE_URL, API_ENDPOINTS } from "@/api/endpoints";
import {
  authJSONStorage,
  clearPersistedAuthFromBothStorages,
} from "@/lib/auth-storage";
import { clearAccountClientCaches } from "@/lib/auth-logout";
import { type User, coercePersistedUser } from "@/models/auth.model";

export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}
export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  login: (tokens: SessionTokens) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

function revokeSessionOnServer(
  accessToken: string | null,
  refreshToken: string | null
): void {
  if (!refreshToken) return;
  void axios
    .post(
      `${API_BASE_URL}/api${API_ENDPOINTS.AUTH.LOGOUT}`,
      { refresh_token: refreshToken },
      {
        headers: {
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    )
    .catch(() => {
      /* still clear client */
    });
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (setState, getState) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,

      setTokens: (accessToken: string, refreshToken: string) =>
        setState({ accessToken, refreshToken, isAuthenticated: true }),

      setUser: (user: User) => setState({ user }),

      login: (tokens: SessionTokens) =>
        setState({
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          user: null,
          isAuthenticated: true,
        }),

      logout: () => {
        const { accessToken, refreshToken } = getState();
        revokeSessionOnServer(accessToken, refreshToken);
        clearAccountClientCaches();
        clearPersistedAuthFromBothStorages();
        setState({
          accessToken: null,
          refreshToken: null,
          user: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      storage: authJSONStorage,
      partialize: (storeState) => ({
        refreshToken: storeState.refreshToken,
        user: storeState.user,
        isAuthenticated: storeState.isAuthenticated,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AuthStore>;
        const coerced = coercePersistedUser(p.user);
        return {
          ...current,
          ...p,
          accessToken: null,
          user: coerced !== null ? coerced : p.user === undefined ? current.user : null,
        };
      },
    }
  )
);
