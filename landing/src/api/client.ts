import axios from 'axios'
import { hasApiBaseUrl, runtimeConfig } from '../config/runtime'

export const apiClient = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 10_000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function checkApiHealth(): Promise<boolean> {
  if (runtimeConfig.useMockData) {
    return true
  }

  if (!hasApiBaseUrl()) {
    console.warn('API health check skipped: VITE_API_BASE_URL is not configured.')
    return true
  }

  const envProbePaths = import.meta.env.VITE_API_HEALTH_PATHS
  const probePaths =
    envProbePaths
      ?.split(',')
      .map((path: string) => path.trim())
      .filter(Boolean) ?? ['/api/health', '/health', '/']

  for (const path of probePaths) {
    try {
      const response = await apiClient.get(path, {
        timeout: 5_000,
        validateStatus: () => true,
      })

      // Any non-5xx HTTP response means backend is reachable.
      if (response.status < 500) {
        return true
      }
    } catch {
      // Try next probe path.
    }
  }

  console.warn('API health check failed: backend is unreachable.')
  return false
}
