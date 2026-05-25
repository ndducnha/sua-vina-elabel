import { apiClient } from '../api/client'
import { STATIC_MODE, staticQrScan } from '../lib/static-mode'

export interface QrScanParams {
  batchCode?: string
  gtin?: string
  manufacturingDate?: string
  sku?: string
  taxCode: string
}

function toApiManufacturingDate(value?: string): string | undefined {
  if (!value) {
    return undefined
  }

  const trimmedValue = value.trim()
  if (!trimmedValue) {
    return undefined
  }

  // Convert UI/ISO date to API-required dd/MM/yyyy format.
  const isoMatch = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }

  // Keep already formatted values intact.
  return trimmedValue
}

export async function fetchQrScanData(params: QrScanParams): Promise<unknown> {
  const manufacturingDate = toApiManufacturingDate(params.manufacturingDate)

  if (STATIC_MODE) {
    return staticQrScan({
      gtin: params.gtin,
      sku: params.sku,
      taxCode: params.taxCode,
      batchCode: params.batchCode,
      manufacturingDate,
    })
  }

  const response = await apiClient.get('/api/qr/scan', {
    params: {
      ...(params.batchCode ? { batch_code: params.batchCode } : {}),
      ...(params.gtin ? { gtin: params.gtin } : {}),
      ...(manufacturingDate ? { manufacturing_date: manufacturingDate } : {}),
      ...(params.sku ? { sku: params.sku } : {}),
      tax_code: params.taxCode,
    },
  })

  return response.data
}
