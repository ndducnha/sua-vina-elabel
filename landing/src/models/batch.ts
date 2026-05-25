/** Lot / batch–related shapes (API + UI journeys). */

export interface ProductRecall {
  recalled: boolean
  reasonVi?: string
  reasonEn?: string
}

export interface ProductTraceabilityEventRow {
  label: string
  value: string
}

export interface ProductTraceabilityEvent {
  occurredAt: string
  rows: ProductTraceabilityEventRow[]
  title: string
  verified?: boolean
}

export interface ProductLotBatchAttributeDisplay {
  field_key: string
  field_type: string
  label_en?: string
  label_vi: string
  value: string
}

/** Row from API `additional_attributes` on batch */
export interface ProductLotAdditionalAttribute {
  field_code: string
  field_name: string
  field_value: string
}

export interface ProductLot {
  serial: string
  manufactureDate: string
  expiryDate: string
  batchStatus?: string
  isCurrentBatch?: boolean
  recall: ProductRecall
  traceabilityUrl?: string
  /** From API `total_quantity` when present */
  totalQuantity?: number
  batchAttributesDisplay?: ProductLotBatchAttributeDisplay[]
  additionalLotAttributes?: ProductLotAdditionalAttribute[]
  traceEvents?: ProductTraceabilityEvent[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}
