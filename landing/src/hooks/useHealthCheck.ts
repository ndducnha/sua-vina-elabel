import { useEffect, useState } from 'react'
import { checkApiHealth } from '../api/client'
import { runtimeConfig } from '../config/runtime'
import { STATIC_MODE } from '../lib/static-mode'

export function useHealthCheck() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (STATIC_MODE || runtimeConfig.useMockData) {
      setIsHealthy(true)
      setIsLoading(false)
      return
    }

    const checkHealth = async () => {
      try {
        const healthy = await checkApiHealth()
        setIsHealthy(healthy)
      } catch (error) {
        console.error('Health check error:', error)
        setIsHealthy(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkHealth()
  }, [])

  return { isHealthy, isLoading }
}
