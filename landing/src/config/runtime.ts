declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_BASE_URL?: string
    }
  }
}

const DEFAULT_API = 'https://api.elabel.dev.vcyber.vn'

function trimOrEmpty(s: string | undefined): string | undefined {
  const t = s?.trim()
  return t && t.length > 0 ? t : undefined
}

export function getRuntimeApiBaseUrl(): string {
  const raw =
    trimOrEmpty(window.__RUNTIME_CONFIG__?.API_BASE_URL) ??
    trimOrEmpty(import.meta.env.VITE_API_BASE_URL) ??
    DEFAULT_API
  return raw.replace(/\/+$/, '')
}

const rawUseMockData = import.meta.env.VITE_USE_MOCK_DATA

export const runtimeConfig = {
  apiBaseUrl: getRuntimeApiBaseUrl(),
  useMockData:
    rawUseMockData === undefined
      ? false
      : rawUseMockData.toLowerCase() === 'true',
}

export function hasApiBaseUrl() {
  return runtimeConfig.apiBaseUrl.length > 0
}
