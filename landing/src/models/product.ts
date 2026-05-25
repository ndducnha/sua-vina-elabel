import type { ProductLot, ProductRecall } from './batch'

export type {
  ProductLot,
  ProductLotAdditionalAttribute,
  ProductLotBatchAttributeDisplay,
  ProductRecall,
  ProductTraceabilityEvent,
  ProductTraceabilityEventRow,
} from './batch'

export type Locale = 'vi' | 'en'

export type ProductTab = 'label' | 'manufacturer' | 'traceability'

export type ProductMediaType = 'image' | 'video' | 'document'

export type OrganizationType = 'manufacturer' | 'distributor' | 'retailer'

export type ProductPageLevel = 'sku' | 'lot'

export interface LocalizedText {
  vi: string
  en?: string
}

export interface ProductCategory {
  itemNo: number
  nameEn: string | null
  nameVi: string
}

export interface ProductField {
  fieldCode: string
  fieldType: 'text' | 'date' | 'textarea' | 'number'
  isRequired: boolean
  label: string
  labelEn: string | null
  source: 'manual' | string
  value: string
}

export interface ProductCustomField {
  fieldCode: string
  label: string
  value: string
}

export interface ProductIdentifiers {
  gtin: string
  publicSlug: string
}

export interface ProductMediaLink {
  title: string
  type: ProductMediaType
  url: string
}

export interface ProductTenant {
  address: string
  contactEmail: string
  contactPhone: string
  gcpCode: string
  name: string
}

export interface ProductData {
  category: ProductCategory
  customFields: ProductCustomField[]
  fields: ProductField[]
  identifiers: ProductIdentifiers
  mediaLinks: ProductMediaLink[]
  productId: string
  productName: string
  publishedAt: string
  riskLevel: 1 | 2 | 3
  updatedAt: string
  versionNo: number
}

export interface PublicOrganization {
  address: string
  contactEmail: string
  contactPhone: string
  mst: string
  name: string
  orgType: OrganizationType
}

export interface BusinessProfile {
  address: string
  email: string
  name: string
  phone: string
}

export interface PublicProductLabel {
  category: ProductCategory
  customFields: ProductCustomField[]
  fields: ProductField[]
  gs1CodeOwner?: BusinessProfile | null
  identifiers: ProductIdentifiers
  lots: ProductLot[]
  mediaLinks: ProductMediaLink[]
  ownerOfGtin: boolean
  productId: string
  productName: LocalizedText
  productRecall: ProductRecall
  riskLevel: 1 | 2 | 3
  supplierName: LocalizedText
  targetMarket: LocalizedText
  updatedAt: string
  versionNo: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}

export interface ProductCatalogEntry {
  gtin: string
  organizations: PublicProductLabel[]
}

export interface ParsedGs1Link {
  gtin: string | null
  lot: string | null
  mst: string | null
  serial: string | null
  sku: string | null
}

export interface ResolvedPublicProduct {
  declarantRequested: string | null
  fallbackNotice: boolean
  fallbackReason: 'missing' | 'invalid-format' | 'not-found' | null
  level: ProductPageLevel
  lot: ProductLot | null
  parsed: ParsedGs1Link
  product: PublicProductLabel | null
  status: 'ok' | 'not-found'
}

export interface Labels {
  portal: string
  langSwitch: string
  labelTab: string
  mfrTab: string
  requiredTitle: string
  customTitle: string
  mediaTitle: string
  imagesTitle: string
  videosTitle: string
  docsTitle: string
  mfrTitle: string
  companyName: string
  gcpCode: string
  email: string
  phone: string
  address: string
  updated: string
  verified: string
}