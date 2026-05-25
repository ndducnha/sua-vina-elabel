/**
 * Static-mode helpers for the landing page.
 * Activated when `VITE_STATIC_MODE === "true"`. The QR-scan API call is
 * short-circuited to a client-side lookup in `/public/data/products.json`.
 */
export const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === 'true'

interface StaticDataset {
  generated_at: string
  business: Record<string, string>
  products: any[]
}

let cache: StaticDataset | null = null
let inflight: Promise<StaticDataset> | null = null

export async function loadStaticDataset(): Promise<StaticDataset> {
  if (cache) return cache
  if (inflight) return inflight
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  inflight = fetch(`${base}/data/products.json`)
    .then((r) => r.json() as Promise<StaticDataset>)
    .then((d) => {
      cache = d
      return d
    })
  return inflight
}

export interface StaticScanParams {
  gtin?: string
  sku?: string
  taxCode?: string
  batchCode?: string
  manufacturingDate?: string
}

export async function staticQrScan(params: StaticScanParams): Promise<{ data: { product: any; batch: any | null } } | null> {
  const ds = await loadStaticDataset()
  const product = ds.products.find((p) => {
    if (params.gtin && p.gtin !== params.gtin) return false
    if (params.sku && !params.gtin && p.sku !== params.sku) return false
    if (params.taxCode && p.tax_code !== params.taxCode) return false
    return true
  })
  if (!product) return null
  let highlight = product.batches?.[0] ?? null
  if (params.batchCode) {
    highlight = product.batches?.find((b: any) => b.batch_code === params.batchCode) ?? highlight
  }
  if (params.manufacturingDate) {
    highlight = product.batches?.find((b: any) => b.manufacturing_date === params.manufacturingDate) ?? highlight
  }
  return { data: { product, batch: highlight } }
}
