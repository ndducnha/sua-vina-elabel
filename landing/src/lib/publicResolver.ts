import { fetchQrScanData } from '../services/qrScanService'
import { hasApiBaseUrl } from '../config/runtime'
import { buildCatalogFromScanPayload } from './dynamicCatalog'
import { publicCatalog } from '../constants/publicCatalog'
import type { ProductLot } from '../models/batch'
import type {
  ParsedGs1Link,
  ProductCatalogEntry,
  PublicProductLabel,
  ResolvedPublicProduct,
} from '../models/product'

const MST_PATTERN = /^\d{10}(?:\d{3})?$/

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function parseGs1DigitalLink(pathname: string): ParsedGs1Link {
  const segments = pathname.split('/').filter(Boolean)
  let gtin: string | null = null
  let lot: string | null = null
  let mst: string | null = null
  let serial: string | null = null
  let sku: string | null = null

  for (let index = 0; index < segments.length; index += 2) {
    const ai = segments[index]
    const value = segments[index + 1]

    if (!value) {
      break
    }

    const decodedValue = safeDecode(value)

    if (ai === '01') {
      gtin = decodedValue
      continue
    }

    if (ai === '10') {
      lot = decodedValue
      continue
    }

    if (ai === '21') {
      serial = decodedValue
    }
  }

  // Custom URL mode: /{MST}/{SKU} or /{MST}/{SKU}/{lotNumber}
  if (!gtin && segments.length >= 2) {
    const firstSegment = safeDecode(segments[0]).trim()
    if (MST_PATTERN.test(firstSegment)) {
      const skuSegment = safeDecode(segments[1]).trim()
      const lotSegment = segments[2] ? safeDecode(segments[2]).trim() : ''

      if (skuSegment) {
        mst = firstSegment
        sku = skuSegment
        if (lotSegment) {
          lot = lotSegment
        }
      }
    }
  }

  return { gtin, lot, mst, serial, sku }
}

function extractSku(product: PublicProductLabel): string | null {
  const candidates = [
    product?.sku,
    product?.product_sku,
    product?.sku_code,
    product?.item_code,
    product?.product_code,
    product?.code,
  ]

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (value) {
      return value
    }
  }

  return null
}

function extractTaxCode(product: PublicProductLabel): string | null {
  const candidates = [
    product?.business?.mst,
    product?.mst,
    product?.tax_code,
    product?.taxCode,
  ]

  for (const candidate of candidates) {
    const value = String(candidate ?? '').trim()
    if (value) {
      return value
    }
  }

  return null
}

function findProductByCustomPath(
  catalogEntries: ProductCatalogEntry[],
  mst: string,
  sku: string,
): PublicProductLabel | null {
  const normalizedMst = mst.trim()
  const normalizedSku = sku.trim().toLowerCase()

  for (const entry of catalogEntries) {
    const matched = entry.organizations.find((org) => {
      if (extractTaxCode(org) !== normalizedMst) {
        return false
      }

      const orgSku = extractSku(org)
      if (!orgSku) {
        return false
      }

      return orgSku.trim().toLowerCase() === normalizedSku
    })

    if (matched) {
      return matched
    }
  }

  // Fallback: if backend returns only one product for this MST, use it even if SKU field is absent.
  const mstMatchedProducts = catalogEntries
    .flatMap((entry) => entry.organizations)
    .filter((org) => extractTaxCode(org) === normalizedMst)

  if (mstMatchedProducts.length === 1) {
    return mstMatchedProducts[0]
  }

  return null
}

function findProductBySku(
  catalogEntries: ProductCatalogEntry[],
  sku: string,
  taxCode?: string | null,
): PublicProductLabel | null {
  const normalizedSku = sku.trim().toLowerCase()
  const normalizedTaxCode = taxCode?.trim() || null

  const candidates = catalogEntries
    .flatMap((entry) => entry.organizations)
    .filter((org) => {
      const orgSku = extractSku(org)
      if (!orgSku) {
        return false
      }

      if (orgSku.trim().toLowerCase() !== normalizedSku) {
        return false
      }

      if (!normalizedTaxCode) {
        return true
      }

      return extractTaxCode(org) === normalizedTaxCode
    })

  return candidates[0] ?? null
}

function getOwnerLabel(entry: ProductCatalogEntry): PublicProductLabel | null {
  return entry.organizations.find((org) => org.ownerOfGtin) ?? null
}

function findLot(product: PublicProductLabel, lotSerial: string | null): ProductLot | null {
  if (!lotSerial) {
    return null
  }

  return product.lots.find((lot) => lot.serial === lotSerial) ?? null
}

function findLotByLookup(
  product: PublicProductLabel,
  batchCode?: string,
  manufacturingDate?: string,
): ProductLot | null {
  const normalizedBatchCode = batchCode?.trim().toLowerCase() ?? ''
  const normalizedManufacturingDate = manufacturingDate?.trim() ?? ''

  if (!normalizedBatchCode && !normalizedManufacturingDate) {
    return null
  }

  return (
    product.lots.find((lot) => {
      const batchMatches = normalizedBatchCode ? lot.serial.toLowerCase() === normalizedBatchCode : true
      const dateMatches = normalizedManufacturingDate
        ? lot.manufactureDate === normalizedManufacturingDate
        : true

      return batchMatches && dateMatches
    }) ?? null
  )
}

function applyRecallVisibilityPolicy(resolved: ResolvedPublicProduct): ResolvedPublicProduct {
  // Keep recalled results visible. UI is responsible for rendering recall status.
  return resolved
}

function applyLookupOverride(
  resolved: ResolvedPublicProduct,
  lookup?: {
    batchCode?: string
    gtin?: string
    manufacturingDate?: string
    mst?: string
    sku?: string
    taxCode?: string
  },
): ResolvedPublicProduct {
  if (!lookup || !resolved.product) {
    return resolved
  }

  const matchedLot = findLotByLookup(resolved.product, lookup.batchCode, lookup.manufacturingDate)
  if (!matchedLot) {
    return resolved
  }

  return {
    ...resolved,
    level: 'lot',
    lot: matchedLot,
  }
}

function buildScanParams(
  url: URL,
  lookup?: {
    batchCode?: string
    gtin?: string
    manufacturingDate?: string
    mst?: string
    sku?: string
    taxCode?: string
  },
): {
  batchCode?: string
  gtin?: string
  manufacturingDate?: string
  sku?: string
  taxCode: string
} | null {
  const parsed = parseGs1DigitalLink(url.pathname)
  const isCustomPathMode = Boolean(parsed.mst && parsed.sku)

  // Support GS1 path/query mode
  const gtin =
    lookup?.gtin?.trim() ||
    (!isCustomPathMode ? parsed.gtin : null) ||
    url.searchParams.get('gtin') ||
    null

  // Support custom path mode
  const sku = lookup?.sku?.trim() || parsed.sku || url.searchParams.get('sku') || null

  // In custom path mode, MST comes from path partition key and is independent from ?8000
  const taxCode = isCustomPathMode
    ? parsed.mst
    : lookup?.taxCode?.trim() || url.searchParams.get('8000') || url.searchParams.get('tax_code') || null

  if (!taxCode || (!gtin && !sku)) {
    return null
  }

  const batchCode = lookup?.batchCode?.trim() || parsed.lot || url.searchParams.get('batch_code') || undefined
  const manufacturingDate =
    lookup?.manufacturingDate?.trim() || url.searchParams.get('manufacturing_date') || undefined

  return {
    ...(batchCode ? { batchCode } : {}),
    ...(gtin ? { gtin } : {}),
    ...(manufacturingDate ? { manufacturingDate } : {}),
    ...(sku ? { sku } : {}),
    taxCode,
  }
}

function resolveDeclarant(
  entry: ProductCatalogEntry,
  declarantRequested: string | null,
): {
  fallbackNotice: boolean
  fallbackReason: 'missing' | 'invalid-format' | 'not-found' | null
  product: PublicProductLabel | null
} {
  const owner = getOwnerLabel(entry)

  if (!declarantRequested) {
    return {
      fallbackNotice: false,
      fallbackReason: null,
      product: owner,
    }
  }

  if (!MST_PATTERN.test(declarantRequested)) {
    return {
      fallbackNotice: true,
      fallbackReason: 'invalid-format',
      product: owner,
    }
  }

  const matched = entry.organizations.find((org) => extractTaxCode(org) === declarantRequested)
  if (matched) {
    return {
      fallbackNotice: false,
      fallbackReason: null,
      product: matched,
    }
  }

  return {
    fallbackNotice: true,
    fallbackReason: 'not-found',
    product: owner,
  }
}

export function resolvePublicProduct(
  url: URL,
  catalogEntries: ProductCatalogEntry[] = [],
): ResolvedPublicProduct {
  const parsed = parseGs1DigitalLink(url.pathname)
  const isCustomPathMode = Boolean(parsed.mst && parsed.sku)

  // Also support ?gtin= query param (used by /qr-scan route)
  if (!isCustomPathMode && !parsed.gtin && url.searchParams.get('gtin')) {
    parsed.gtin = url.searchParams.get('gtin')
    parsed.lot = url.searchParams.get('batch_code') ?? parsed.lot
  }

  if (!isCustomPathMode && !parsed.sku && url.searchParams.get('sku')) {
    parsed.sku = url.searchParams.get('sku')
  }

  if (!parsed.gtin && !parsed.sku) {
    return applyRecallVisibilityPolicy({
      declarantRequested: url.searchParams.get('8000'),
      fallbackNotice: false,
      fallbackReason: 'missing',
      level: 'sku',
      lot: null,
      parsed,
      product: null,
      status: 'not-found',
    })
  }

  let product: PublicProductLabel | null = null

  if (isCustomPathMode && parsed.mst && parsed.sku) {
    product = findProductByCustomPath(catalogEntries, parsed.mst, parsed.sku)
  } else if (parsed.gtin) {
    const catalogEntry = catalogEntries.find((entry) => entry.gtin === parsed.gtin)
    if (catalogEntry) {
      const declarantRequested = url.searchParams.get('8000')
      const declarantResolution = resolveDeclarant(catalogEntry, declarantRequested)
      product = declarantResolution.product

      if (!product) {
        return applyRecallVisibilityPolicy({
          declarantRequested,
          fallbackNotice: true,
          fallbackReason: 'missing',
          level: parsed.lot ? 'lot' : 'sku',
          lot: null,
          parsed,
          product: null,
          status: 'not-found',
        })
      }

      const level = parsed.lot ? 'lot' : 'sku'
      const lot = findLot(product, parsed.lot)

      return applyRecallVisibilityPolicy({
        declarantRequested,
        fallbackNotice: declarantResolution.fallbackNotice,
        fallbackReason: declarantResolution.fallbackReason,
        level,
        lot,
        parsed,
        product,
        status: 'ok',
      })
    }
  } else if (parsed.sku) {
    const declarantRequested =
      url.searchParams.get('8000') ?? url.searchParams.get('tax_code')
    product = findProductBySku(catalogEntries, parsed.sku, declarantRequested)
  }

  if (!product) {
    return applyRecallVisibilityPolicy({
      declarantRequested: url.searchParams.get('8000'),
      fallbackNotice: false,
      fallbackReason: null,
      level: parsed.lot ? 'lot' : 'sku',
      lot: null,
      parsed,
      product: null,
      status: 'not-found',
    })
  }

  // GS1 edge-case rule: when both AI 10 and AI 21 are present, lot view has priority.
  const level = parsed.lot ? 'lot' : 'sku'
  const lot = findLot(product, parsed.lot)

  return applyRecallVisibilityPolicy({
    declarantRequested: url.searchParams.get('8000'),
    fallbackNotice: false,
    fallbackReason: null,
    level,
    lot,
    parsed,
    product,
    status: 'ok',
  })
}

export function isValidMst(value: string): boolean {
  return MST_PATTERN.test(value)
}

export async function resolvePublicProductFromApi(
  url: URL,
  lookup?: {
    batchCode?: string
    gtin?: string
    manufacturingDate?: string
    mst?: string
    sku?: string
    taxCode?: string
  },
): Promise<ResolvedPublicProduct> {
  const parsed = parseGs1DigitalLink(url.pathname)

  const notFound: ResolvedPublicProduct = {
    declarantRequested: url.searchParams.get('8000'),
    fallbackNotice: false,
    fallbackReason: 'not-found',
    level: 'sku',
    lot: null,
    parsed,
    product: null,
    status: 'not-found',
  }

  if (!hasApiBaseUrl()) {
    return applyLookupOverride(resolvePublicProduct(url, publicCatalog), lookup)
  }

  const scanParams = buildScanParams(url, lookup)
  if (!scanParams) {
    return notFound
  }

  try {
    const scanPayload = await fetchQrScanData(scanParams)
    const catalogEntries = buildCatalogFromScanPayload(scanPayload)

    if (catalogEntries.length > 0) {
      const resolved = applyLookupOverride(resolvePublicProduct(url, catalogEntries), lookup)
      return mergeLocalTraceEvents(resolved, url)
    }

    const shouldRetryWithoutLotParams = Boolean(scanParams.batchCode || scanParams.manufacturingDate)
    if (!shouldRetryWithoutLotParams) {
      return notFound
    }

    const skuOnlyPayload = await fetchQrScanData({
      ...(scanParams.gtin ? { gtin: scanParams.gtin } : {}),
      ...(scanParams.sku ? { sku: scanParams.sku } : {}),
      taxCode: scanParams.taxCode,
    })
    const skuOnlyEntries = buildCatalogFromScanPayload(skuOnlyPayload)

    if (skuOnlyEntries.length === 0) {
      return notFound
    }

    const resolved = applyLookupOverride(resolvePublicProduct(url, skuOnlyEntries), lookup)
    return mergeLocalTraceEvents(resolved, url)
  } catch (error) {
    console.warn('QR scan resolve failed:', error)
    if (lookup) {
      throw error
    }
    return notFound
  }
}

function mergeLocalTraceEvents(resolved: ResolvedPublicProduct, url: URL): ResolvedPublicProduct {
  if (!resolved.product) {
    return resolved
  }

  const localResolved = resolvePublicProduct(url, publicCatalog)
  if (!localResolved.product) {
    return resolved
  }

  const localLotMap = new Map(
    localResolved.product.lots.map((lot) => [lot.serial, lot.traceEvents]),
  )

  return {
    ...resolved,
    product: {
      ...resolved.product,
      lots: resolved.product.lots.map((lot) => ({
        ...lot,
        traceEvents: lot.traceEvents?.length ? lot.traceEvents : (localLotMap.get(lot.serial) ?? []),
      })),
    },
  }
}
