import { useEffect } from 'react'

export function useProductMetadata(title: string) {
  useEffect(() => {
    document.title = `${title} | e-Label`
  }, [title])
}