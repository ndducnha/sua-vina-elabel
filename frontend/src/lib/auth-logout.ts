import { queryClient } from "@/lib/query-client";
import { useAuthStore } from "@/stores/auth.store";

/** localStorage prefix for persisted product-edit drafts (legacy / product edit flows). */
const PRODUCT_EDIT_DRAFT_PREFIX = "draft_edit_";

const accountCacheCleanups: Array<() => void> = [];

export function registerAccountCacheCleanup(fn: () => void): void {
  accountCacheCleanups.push(fn);
}

function removeKeysWithPrefix(storage: Storage, prefix: string): void {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  for (const k of keys) storage.removeItem(k);
}

/**
 * Drops client-side caches tied to the signed-in session (RQ cache, wizard, tasks, edit drafts).
 * UI language preference is intentionally left untouched.
 */
export function clearAccountClientCaches(): void {
  queryClient.clear();
  for (const fn of accountCacheCleanups) {
    try {
      fn();
    } catch {
      /* ignore cleanup errors */
    }
  }

  if (typeof window !== "undefined") {
    removeKeysWithPrefix(localStorage, PRODUCT_EDIT_DRAFT_PREFIX);
  }
}

export function resolvePostLoginPath(fromPathname: string | undefined): string {
  if (!fromPathname) return "/products";
  if (/^\/products\/[^/]+(\/edit)?\/?$/.test(fromPathname)) return "/products";
  if (/^\/product-create(-secondary-label)?\/?$/.test(fromPathname)) return "/products";
  return fromPathname;
}

/**
 * Clears auth + session caches and hard-navigates to login (drops react-router location.state).
 */
export function logoutAndRedirectToLogin(): void {
  useAuthStore.getState().logout();
  if (typeof window !== "undefined") {
    window.location.replace("/auth/login");
  }
}
