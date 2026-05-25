/**
 * Lot/batch helpers and label-tab row builders for the product landing page.
 */
import type { ReactNode } from 'react'
import productLandingVi from '@/i18n/locales/productLanding.vi.json'
import { MOCK_GTINS } from '@/constants/mockGtins'
import { publicCatalog } from '@/constants/publicCatalog'
import { buildCatalogFromScanPayload } from '@/lib/dynamicCatalog'
import { resolvePublicProduct } from '@/lib/publicResolver'
import type { ProductLot, ProductTraceabilityEvent } from '@/models/batch'
import type { PublicProductLabel, ResolvedPublicProduct } from '@/models/product'

export type TraceabilityEventRow = {
  label: string
  value: string
}

export type TraceabilityEvent = {
  id: string
  occurredAt: string
  rows: TraceabilityEventRow[]
  title: string
  verified?: boolean
}

export type IframeMessagePayload = {
  payload?: unknown
  type?: string
}

export type ProductLandingBatchUi = typeof productLandingVi

export type LotBatchRow = {
  key: string
  label: string
  value: ReactNode
}

const looseLookupGtins: Set<string> = new Set(MOCK_GTINS)

export function normalizeExternalUrl(value: string | undefined): string | null {
  const trimmedValue = value?.trim()
  if (!trimmedValue) {
    return null
  }

  try {
    const parsed = new URL(trimmedValue)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }

    return parsed.toString()
  } catch {
    return null
  }
}

export function buildLotBatchRows(
  currentLot: ProductLot,
  locale: 'vi' | 'en',
  ui: ProductLandingBatchUi,
): LotBatchRow[] {
  const skippedDisplayKeys = new Set<string>()
  if (currentLot.manufactureDate && currentLot.manufactureDate !== '-') {
    skippedDisplayKeys.add('F02')
  }
  if (currentLot.expiryDate && currentLot.expiryDate !== '-') {
    skippedDisplayKeys.add('F05')
  }

  const displayAttrRows = currentLot.batchAttributesDisplay?.filter((row) => !skippedDisplayKeys.has(row.field_key)) ?? []

  const rows: LotBatchRow[] = [
    { key: 'lot-serial', label: ui.batchNumber, value: currentLot.serial ?? '—' },
    ...(typeof currentLot.totalQuantity === 'number'
      ? [{ key: 'lot-total-qty', label: ui.lotTotalQuantity, value: String(currentLot.totalQuantity) }]
      : []),
    { key: 'lot-mfg', label: ui.manufactureDate, value: currentLot.manufactureDate ?? '—' },
    { key: 'lot-exp', label: ui.expiryDate, value: currentLot.expiryDate ?? '—' },
  ]

  displayAttrRows.forEach((row, i) => {
    rows.push({
      key: `lot-attr-${row.field_key}-${i}`,
      label: locale === 'en' ? row.label_en?.trim() || row.label_vi : row.label_vi,
      value: row.value ?? '—',
    })
  })

  currentLot.additionalLotAttributes?.forEach((row, i) => {
    rows.push({
      key: `lot-add-${row.field_code}-${i}`,
      label: row.field_name?.trim() || row.field_code,
      value: row.field_value ?? '—',
    })
  })

  return rows
}

export function shouldUseLooseLookup(gtin: string | null | undefined): boolean {
  return Boolean(gtin && looseLookupGtins.has(gtin))
}

export function findLots(product: PublicProductLabel, manufactureDate: string, lotSerial: string): ProductLot[] {
  const normalizedSerial = lotSerial.trim().toLowerCase()

  return product.lots.filter((lot) => {
    const matchDate = manufactureDate ? lot.manufactureDate === manufactureDate : true
    const matchSerial = normalizedSerial ? lot.serial.toLowerCase() === normalizedSerial : true

    return matchDate && matchSerial
  })
}

export function getFallbackLotsForLookup(product: PublicProductLabel, manufactureDate: string): ProductLot[] {
  const lotsByDate = manufactureDate ? product.lots.filter((lot) => lot.manufactureDate === manufactureDate) : product.lots

  if (lotsByDate.length === 0) {
    return []
  }

  const lotsWithJourney = lotsByDate.filter((lot) => (lot.traceEvents?.length ?? 0) > 0)
  return lotsWithJourney.length > 0 ? lotsWithJourney : lotsByDate
}

export function getCatalogFallbackLotsForLookup(gtin: string, manufactureDate: string): ProductLot[] {
  const catalogEntry = publicCatalog.find((entry) => entry.gtin === gtin)
  const ownerProduct = catalogEntry?.organizations.find((organization) => organization.ownerOfGtin)
  const fallbackProduct = ownerProduct ?? catalogEntry?.organizations[0]

  if (!fallbackProduct) {
    return []
  }

  return getFallbackLotsForLookup(fallbackProduct, manufactureDate)
}

export function getCatalogTraceEventsByGtin(gtin: string | null | undefined): ProductTraceabilityEvent[] {
  if (!gtin) {
    return []
  }

  const lotWithTrace = publicCatalog
    .find((entry) => entry.gtin === gtin)
    ?.organizations.flatMap((organization) => organization.lots)
    .find((lot) => (lot.traceEvents?.length ?? 0) > 0)

  return lotWithTrace?.traceEvents ?? []
}

export function enrichLotWithCatalogTraceEvents(lot: ProductLot, gtin: string | null | undefined): ProductLot {
  const safeGtin = gtin?.trim()
  if (!safeGtin) {
    return lot
  }

  const existing = lot.traceEvents?.length ?? 0
  if (existing > 0) {
    return lot
  }

  const fallback = getCatalogTraceEventsByGtin(safeGtin)
  return fallback.length > 0 ? { ...lot, traceEvents: fallback } : lot
}

export function buildTraceabilityEvents(lot: ProductLot, gtin: string | null | undefined): TraceabilityEvent[] {
  const eventsSource = getCatalogTraceEventsByGtin(gtin)
  const events = eventsSource.length > 0 ? eventsSource : lot.traceEvents ?? []

  if (events.length > 0) {
    return events.map((event, index) => ({
      id: `custom-${index + 1}`,
      occurredAt: event.occurredAt,
      rows: event.rows,
      title: event.title,
      verified: event.verified,
    }))
  }
  return []
}

export function getReferrerOrigin(): string | null {
  if (!document.referrer) {
    return null
  }

  try {
    return new URL(document.referrer).origin
  } catch {
    return null
  }
}

export function resolveFromScanPayload(scanPayload: unknown): ResolvedPublicProduct | null {
  const entries = buildCatalogFromScanPayload(scanPayload)
  if (entries.length === 0) {
    return null
  }

  const resolvedFromUrl = resolvePublicProduct(new URL(window.location.href), entries)
  if (resolvedFromUrl.status === 'ok' && resolvedFromUrl.product) {
    return resolvedFromUrl
  }

  const firstProduct = entries[0]?.organizations[0] ?? null
  if (!firstProduct) {
    return null
  }

  const firstLot = firstProduct.lots[0] ?? null

  return {
    declarantRequested: null,
    fallbackNotice: false,
    fallbackReason: null,
    level: firstLot ? 'lot' : 'sku',
    lot: firstLot,
    parsed: {
      gtin: entries[0].gtin,
      lot: firstLot?.serial ?? null,
      mst: null,
      serial: null,
      sku: null,
    },
    product: firstProduct,
    status: 'ok',
  }
}
