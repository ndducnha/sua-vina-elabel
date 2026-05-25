import { resolvePublicProductFromApi } from '../lib/publicResolver'
import type { ResolvedPublicProduct } from '../models/product'

export interface PublicProductLookup {
  batchCode?: string
  gtin?: string
  manufacturingDate?: string
  mst?: string
  sku?: string
  taxCode?: string
}

export async function resolvePublicProductData(
  url: URL,
  lookup?: PublicProductLookup,
): Promise<ResolvedPublicProduct> {
  return resolvePublicProductFromApi(url, lookup)
}
