import type { PropsWithChildren } from 'react'
import { BrowserRouter } from 'react-router'
import { useHealthCheck } from '../hooks/useHealthCheck'

function HealthCheckProvider({ children }: PropsWithChildren) {
  const { isHealthy, isLoading } = useHealthCheck()

  if (isLoading) {
    return <>{children}</>
  }

  if (!isHealthy) {
    console.warn('API is not available. Some features may not work correctly.')
  }

  return <>{children}</>
}

export function AppProviders({ children }: PropsWithChildren) {
  const basename = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '') || '/'
  return (
    <BrowserRouter basename={basename}>
      <HealthCheckProvider>{children}</HealthCheckProvider>
    </BrowserRouter>
  )
}