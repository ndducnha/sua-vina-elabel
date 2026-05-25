import { createJSONStorage } from "zustand/middleware";

/** Zustand persist name — must match `persist({ name })` in auth store. */
export const AUTH_PERSIST_KEY = "auth-storage";

/**
 * Chooses session vs local persistence for refresh token (and user snapshot).
 * Stored in localStorage so the auth store can read it before opening the real storage.
 */
export const AUTH_PERSIST_SCOPE_KEY = "elabel-auth-persist-scope";

export type AuthPersistScope = "session" | "local";

export function getAuthPersistScope(): AuthPersistScope {
  if (typeof window === "undefined") return "session";
  return localStorage.getItem(AUTH_PERSIST_SCOPE_KEY) === "local" ? "local" : "session";
}

/** Call immediately before `login()` so the next persist write goes to the right Storage. */
export function prepareAuthPersistenceForLogin(rememberMe: boolean): void {
  if (typeof window === "undefined") return;

  const scope: AuthPersistScope = rememberMe ? "local" : "session";
  localStorage.setItem(AUTH_PERSIST_SCOPE_KEY, scope);

  if (rememberMe) {
    sessionStorage.removeItem(AUTH_PERSIST_KEY);
  } else {
    localStorage.removeItem(AUTH_PERSIST_KEY);
  }
}

export function clearPersistedAuthFromBothStorages(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_PERSIST_KEY);
  sessionStorage.removeItem(AUTH_PERSIST_KEY);
  localStorage.removeItem(AUTH_PERSIST_SCOPE_KEY);
}

function getAuthStateStorage(): Storage {
  if (typeof window === "undefined") {
    return {
      length: 0,
      clear: () => {},
      getItem: () => null,
      key: () => null,
      removeItem: () => {},
      setItem: () => {},
    };
  }

  return getAuthPersistScope() === "local" ? localStorage : sessionStorage;
}

/** Zustand JSON storage: remember-me → localStorage, otherwise sessionStorage. */
export const authJSONStorage = createJSONStorage(getAuthStateStorage);
