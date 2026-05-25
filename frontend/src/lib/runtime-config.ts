const DEFAULT_API = "https://api.elabel.dev.vcyber.vn";
const DEFAULT_LANDING = "https://landing.elabel.dev.vcyber.vn";

function trimOrEmpty(s: string | undefined): string | undefined {
  const t = s?.trim();
  return t && t.length > 0 ? t : undefined;
}

function normalizeLandingBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function getRuntimeApiBaseUrl(): string {
  const raw =
    trimOrEmpty(window.__RUNTIME_CONFIG__?.API_BASE_URL) ??
    trimOrEmpty(import.meta.env.VITE_API_BASE_URL) ??
    DEFAULT_API;
  return raw.replace(/\/+$/, "");
}

/**
 * Landing origin for QR payloads and iframe preview.
 */
export function getRuntimeLandingPageUrl(): string {
  const raw =
    trimOrEmpty(window.__RUNTIME_CONFIG__?.LANDING_PAGE_URL) ??
    trimOrEmpty(import.meta.env.VITE_ELABEL_LANDING_BASE_URL) ??
    trimOrEmpty(import.meta.env.VITE_PREVIEW_TARGET_DOMAIN) ??
    DEFAULT_LANDING;
  try {
    return normalizeLandingBaseUrl(new URL(raw).origin);
  } catch {
    return normalizeLandingBaseUrl(DEFAULT_LANDING);
  }
}
