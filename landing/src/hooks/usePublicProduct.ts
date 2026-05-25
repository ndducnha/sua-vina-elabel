import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router'
import type { ResolvedPublicProduct } from '../models/product'
import {
  resolvePublicProductData,
  type PublicProductLookup,
} from '../services/publicProductService'

export function usePublicProduct() {
  const location = useLocation()
  const currentUrl = useMemo(
    () => new URL(location.pathname + location.search, window.location.origin),
    [location.pathname, location.search],
  )

  const [resolved, setResolved] = useState<ResolvedPublicProduct | null>(null)
  const [isResolving, setIsResolving] = useState(true)

  useEffect(() => {
    let isActive = true

    const loadResolvedProduct = async () => {
      setIsResolving(true)

      const nextResolved = await resolvePublicProductData(currentUrl)
      if (!isActive) {
        return
      }

      setResolved(nextResolved)
      setIsResolving(false)
    }

    void loadResolvedProduct()

    return () => {
      isActive = false
    }
  }, [currentUrl])

  const resolveLookup = useCallback(
    async (lookup?: PublicProductLookup) => resolvePublicProductData(currentUrl, lookup),
    [currentUrl],
  )

  return {
    isResolving,
    resolveLookup,
    resolved,
  }
}
