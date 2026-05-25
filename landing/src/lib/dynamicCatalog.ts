import type { ProductLot } from '../models/batch'
import type {
  BusinessProfile,
  ProductCatalogEntry,
  ProductCustomField,
  ProductField,
  ProductMediaLink,
  PublicProductLabel,
} from '../models/product'

type NullableString = string | null | undefined

type AttributeDisplay = {
  field_key: string
  field_type: string
  label_en?: string
  label_vi: string
  value: NullableString
}

type AdditionalAttribute = {
  field_code: string
  field_name: string
  field_value: NullableString
}

type MutableLabel = {
  categoryName: string
  fields: ProductField[]
  customFields: ProductCustomField[]
  lots: ProductLot[]
  mediaLinks: ProductMediaLink[]
  product: PublicProductLabel
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null
  }

  return value as Record<string, unknown>
}

function unwrapData<T>(payload: unknown): T | null {
  const level1 = asObject(payload)
  if (!level1) {
    return null
  }

  const data1 = level1.data
  if (data1 === undefined) {
    return payload as T
  }

  const level2 = asObject(data1)
  if (!level2) {
    return data1 as T
  }

  const data2 = level2.data
  if (data2 !== undefined) {
    return data2 as T
  }

  return data1 as T
}

function normalizeText(value: unknown): string {
  return String(value ?? '').trim()
}

function toBusinessProfile(
  source: Record<string, unknown> | null,
  fallback?: Record<string, unknown> | null,
): BusinessProfile | null {
  if (!source && !fallback) {
    return null
  }

  const getValue = (...keys: string[]) => {
    for (const key of keys) {
      const sourceValue = normalizeText(source?.[key])
      if (sourceValue) {
        return sourceValue
      }

      const fallbackValue = normalizeText(fallback?.[key])
      if (fallbackValue) {
        return fallbackValue
      }
    }

    return ''
  }

  const profile: BusinessProfile = {
    address: getValue('diaChiDayDu', 'dia_chi_day_du', 'full_address', 'address', 'diaChi'),
    email: getValue('email', 'business_email', 'representative_email'),
    name: getValue('tenDoanhNghiep', 'ten_doanh_nghiep', 'name', 'company_name'),
    phone: getValue('dienThoai', 'dien_thoai', 'phone', 'business_phone'),
  }

  if (!profile.name && !profile.address && !profile.phone && !profile.email) {
    return null
  }

  return profile
}

function mapAttributeObjectToDisplay(attributes: Record<string, unknown> | null): AttributeDisplay[] {
  if (!attributes) {
    return []
  }

  const result: AttributeDisplay[] = []

  for (const [fieldCode, rawValue] of Object.entries(attributes)) {
    const value = String(rawValue ?? '')
    if (!value) {
      continue
    }

    result.push({
      field_key: fieldCode,
      field_type: 'text',
      label_vi: fieldCode,
      value,
    })
  }

  return result
}

function mapAttributeListToDisplay(attributes: unknown): AttributeDisplay[] {
  if (!Array.isArray(attributes)) {
    return []
  }

  const result: AttributeDisplay[] = []

  for (const entry of attributes) {
    const item = asObject(entry)
    if (!item) {
      continue
    }

    const fieldCode = String(item.fieldCode ?? item.field_code ?? '')
    const value = String(item.fieldValue ?? item.field_value ?? '')
    if (!fieldCode || !value) {
      continue
    }

    const labelVi = String(item.fieldName ?? item.field_name ?? fieldCode)
    const labelEn = normalizeText(item.label_en ?? item.labelEn ?? item.field_label_en ?? item.fieldLabelEn)
    result.push({
      field_key: fieldCode,
      field_type: String(item.fieldType ?? item.field_type ?? 'text'),
      label_en: labelEn || undefined,
      label_vi: labelVi,
      value,
    })
  }

  return result
}

function toAttributeValueMap(attributes: unknown): Record<string, string> {
  const result: Record<string, string> = {}

  const objectAttributes = asObject(attributes)
  if (objectAttributes) {
    for (const [key, rawValue] of Object.entries(objectAttributes)) {
      const value = String(rawValue ?? '').trim()
      if (!value) {
        continue
      }

      result[key] = value
    }

    return result
  }

  if (!Array.isArray(attributes)) {
    return result
  }

  for (const entry of attributes) {
    const item = asObject(entry)
    if (!item) {
      continue
    }

    const key = String(item.field_key ?? item.fieldCode ?? item.field_code ?? item.field_name ?? '').trim()
    if (!key) {
      continue
    }

    const value = String(item.value ?? item.fieldValue ?? item.field_value ?? '').trim()
    if (!value) {
      continue
    }

    result[key] = value
  }

  return result
}

function normalizeAttributesDisplay(attributesDisplay: unknown, attributesSource: unknown): AttributeDisplay[] {
  if (!Array.isArray(attributesDisplay)) {
    return []
  }

  const attributeValueMap = toAttributeValueMap(attributesSource)
  const result: AttributeDisplay[] = []

  for (const entry of attributesDisplay) {
    const item = asObject(entry)
    if (!item) {
      continue
    }

    const fieldKey = String(item.field_key ?? item.fieldCode ?? item.field_code ?? item.field_name ?? '').trim()
    if (!fieldKey) {
      continue
    }

    const rawDisplayValue = item.value
    const hasBooleanFlag = typeof rawDisplayValue === 'boolean'
    if (hasBooleanFlag && !rawDisplayValue) {
      continue
    }

    // When display value is a boolean flag, resolve actual content from attributes by field key.
    const resolvedValue = hasBooleanFlag
      ? String(attributeValueMap[fieldKey] ?? '').trim()
      : String(rawDisplayValue ?? attributeValueMap[fieldKey] ?? '').trim()

    if (!resolvedValue) {
      continue
    }

    const labelVi = String(item.label_vi ?? item.fieldName ?? item.field_name ?? fieldKey)
    const labelEn = normalizeText(item.label_en ?? item.labelEn ?? item.field_label_en ?? '')
    result.push({
      field_key: fieldKey,
      field_type: String(item.field_type ?? item.fieldType ?? 'text'),
      label_en: labelEn || undefined,
      label_vi: labelVi,
      value: resolvedValue,
    })
  }

  return result
}

function mapAdditionalList(attributes: unknown): AdditionalAttribute[] {
  if (!Array.isArray(attributes)) {
    return []
  }

  const result: AdditionalAttribute[] = []

  for (const entry of attributes) {
    const item = asObject(entry)
    if (!item) {
      continue
    }

    const fieldCode = String(item.fieldCode ?? item.field_code ?? '')
    const fieldValue = String(item.fieldValue ?? item.field_value ?? '')
    if (!fieldCode || !fieldValue) {
      continue
    }

    result.push({
      field_code: fieldCode,
      field_name: String(item.fieldName ?? item.field_name ?? fieldCode),
      field_value: fieldValue,
    })
  }

  return result
}

function normalizeScanData(scanData: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!scanData) {
    return null
  }

  const product = asObject(scanData.product)
  if (!product) {
    return scanData
  }
  
  const standardBatch = asObject(scanData.batch)
  const hasStandardDisplayFields =
    Array.isArray(product.attributes_display) ||
    Array.isArray(standardBatch?.batch_attributes_display)
  if (hasStandardDisplayFields) {
    return scanData
  }

  const nbcBusiness = asObject(product.nbc_business)
  const declarantBusiness = asObject(product.business)
  const vnpcOwnerBusiness =
    asObject(product.doanhNghiep) ??
    asObject(product.doanh_nghiep) ??
    asObject(scanData.doanhNghiep) ??
    asObject(scanData.doanh_nghiep)
  const isExternalShape = Array.isArray(scanData.batch) || Boolean(nbcBusiness)
  if (!isExternalShape) {
    return scanData
  }

  const batchFromScan = Array.isArray(scanData.batch) ? asObject(scanData.batch[0]) : asObject(scanData.batch)
  const productBatches = Array.isArray(product.batches) ? product.batches : []
  const batchFromProduct = asObject(productBatches[0])
  const batch = batchFromScan ?? batchFromProduct

  const manufacturingDate = String(batch?.manufacturingDate ?? batch?.manufacturing_date ?? '')
  let batchDisplay = mapAttributeListToDisplay(batch?.attributes)
  if (batchDisplay.length === 0) {
    batchDisplay = mapAttributeObjectToDisplay(asObject(batch?.attributes))
  }

  const taxCode = String(
    product.tax_code ??
      nbcBusiness?.tax_code ??
      nbcBusiness?.business_license_number ??
      nbcBusiness?.enterprise_code ??
      '',
  )

  return {
    batch: {
      additional_attributes: [
        ...mapAdditionalList(batch?.additionalAttributes),
        ...mapAdditionalList(batch?.additional_attributes),
      ],
      batch_attributes_display: batchDisplay,
      batch_code: String(batch?.batchCode ?? batch?.batch_code ?? ''),
      inter_industry_attributes: mapAdditionalList(batch?.inter_industry_attributes),
      manufacturing_date: manufacturingDate,
      recall_reason: String(batch?.recall_reason ?? ''),
      status: String(batch?.status ?? ''),
      tax_code: taxCode,
    },
    product: {
      additional_attributes: mapAdditionalList(product.additional_attributes),
      attributes_display: mapAttributeObjectToDisplay(asObject(product.attributes)),
      business: {
        address: String(declarantBusiness?.address ?? declarantBusiness?.full_address ?? ''),
        business_email: String(declarantBusiness?.business_email ?? declarantBusiness?.email ?? ''),
        business_phone: String(declarantBusiness?.business_phone ?? declarantBusiness?.phone ?? ''),
        company_name: String(declarantBusiness?.company_name ?? declarantBusiness?.name ?? ''),
      },
      code_owner_business: nbcBusiness ?? vnpcOwnerBusiness,
      e_label_code: String(product.e_label_code ?? `${String(product.gtin ?? '')}-public`),
      gtin: String(product.gtin ?? product.sku ?? product.product_code ?? ''),
      id: String(product.id ?? product.nbc_product_id ?? ''),
      images: product.images,
      inter_industry_attributes: mapAdditionalList(product.inter_industry_attributes),
      name: String(product.name ?? ''),
      product_group_name: String(product.product_group_name ?? product.brick_name ?? product.brick_code ?? ''),
      recall_reason: String(product.recall_reason ?? ''),
      risk_level: Number(product.risk_level ?? 3),
      status: String(product.status ?? ''),
      tax_code: taxCode,
      updated_at: String(product.updated_at ?? ''),
      version: Number(product.version ?? 0),
    },
  }
}

function toFieldType(raw: string): 'text' | 'date' | 'textarea' | 'number' {
  if (raw === 'date') return 'date'
  if (raw === 'number') return 'number'
  if (raw === 'textarea') return 'textarea'
  return 'text'
}

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function toRecall(status: unknown, reason: unknown): { recalled: boolean; reasonVi?: string; reasonEn?: string } {
  const recalled = String(status ?? '').trim().toLowerCase() === 'recalled'
  if (!recalled) {
    return { recalled: false }
  }

  const normalizedReason = String(reason ?? '').trim()
  if (!normalizedReason) {
    return { recalled: true }
  }

  return {
    recalled: true,
    reasonEn: normalizedReason,
    reasonVi: normalizedReason,
  }
}

function toFields(attributesDisplay: AttributeDisplay[] | undefined): ProductField[] {
  if (!attributesDisplay) {
    return []
  }

  return attributesDisplay
    .filter((item) => normalizeValue(item.value).length > 0)
    .map((item) => ({
      fieldCode: item.field_key,
      fieldType: toFieldType(item.field_type),
      isRequired: true,
      label: item.label_vi,
      labelEn: null,
      source: 'dynamic',
      value: normalizeValue(item.value),
    }))
}

function toCustomFields(list: AdditionalAttribute[] | undefined): ProductCustomField[] {
  if (!list) {
    return []
  }

  return list
    .filter((item) => normalizeValue(item.field_value).length > 0)
    .map((item) => ({
      fieldCode: item.field_code,
      label: item.field_name,
      value: normalizeValue(item.field_value),
    }))
}

function parseDateFromDmy(raw: NullableString): string {
  const value = normalizeValue(raw)
  if (!value) {
    return '-'
  }

  const [day, month, year] = value.split('/')
  if (!day || !month || !year) {
    return value
  }

  return `${year}-${month}-${day}`
}

function findDisplayValueByKey(items: AttributeDisplay[] | undefined, key: string): string {
  if (!items) {
    return '-'
  }

  const found = items.find((item) => item.field_key === key)
  return parseDateFromDmy(found?.value)
}

function toLot(
  batchCode: NullableString,
  batchDisplay: AttributeDisplay[] | undefined,
  batchAdditional: AdditionalAttribute[] | undefined,
  directManufactureDate?: NullableString,
  traceabilityUrl?: NullableString,
  status?: unknown,
  recallReason?: unknown,
  isCurrent?: unknown,
  totalQuantityRaw?: unknown,
): ProductLot | null {
  const serial = normalizeValue(batchCode)
  if (!serial) {
    return null
  }

  const manufactureFromDisplay = findDisplayValueByKey(batchDisplay, 'F02')
  const expiryFromDisplay = findDisplayValueByKey(batchDisplay, 'F05')

  const normalizedStatus = normalizeValue(String(status ?? ''))

  const qtyParsed = typeof totalQuantityRaw === 'number' ? totalQuantityRaw : Number(totalQuantityRaw)
  const totalQuantity = Number.isFinite(qtyParsed) ? qtyParsed : undefined

  const batchAttributesDisplay =
    batchDisplay && batchDisplay.length > 0
      ? batchDisplay.map((item) => ({
          field_key: item.field_key,
          field_type: item.field_type,
          label_vi: item.label_vi,
          ...(item.label_en ? { label_en: item.label_en } : {}),
          value: String(item.value ?? '').trim() || '—',
        }))
      : undefined

  const additionalLotAttributes =
    batchAdditional && batchAdditional.length > 0
      ? batchAdditional.map((a) => ({
          field_code: a.field_code,
          field_name: a.field_name,
          field_value: String(a.field_value ?? ''),
        }))
      : undefined

  return {
    additionalLotAttributes,
    batchAttributesDisplay,
    batchStatus: normalizedStatus || undefined,
    expiryDate: expiryFromDisplay,
    isCurrentBatch: Boolean(isCurrent),
    // Real API returns manufacturing_date directly on batch; fall back when F02 is absent
    manufactureDate: manufactureFromDisplay !== '-' ? manufactureFromDisplay : parseDateFromDmy(directManufactureDate),
    recall: toRecall(status, recallReason),
    serial,
    ...(totalQuantity !== undefined ? { totalQuantity } : {}),
    traceabilityUrl: normalizeValue(traceabilityUrl),
  }
}

function normalizeBatchItem(batch: Record<string, unknown>): Record<string, unknown> {
  let batchDisplay = batch.batch_attributes_display as AttributeDisplay[] | undefined
  if (!Array.isArray(batchDisplay) || batchDisplay.length === 0) {
    batchDisplay = mapAttributeListToDisplay(batch.attributes)
    if (batchDisplay.length === 0) {
      batchDisplay = mapAttributeObjectToDisplay(asObject(batch.attributes))
    }
  }

  return {
    additional_attributes: [
      ...mapAdditionalList(batch.additional_attributes),
      ...mapAdditionalList(batch.additionalAttributes),
    ],
    batch_attributes_display: batchDisplay,
    batch_code: String(batch.batch_code ?? batch.batchCode ?? ''),
    is_current: Boolean(batch.is_current ?? batch.isCurrent),
    manufacturing_date: String(batch.manufacturing_date ?? batch.manufacturingDate ?? ''),
    recall_reason: String(batch.recall_reason ?? ''),
    status: String(batch.status ?? ''),
    tax_code: String(batch.tax_code ?? batch.taxCode ?? ''),
    traceability_url: String(batch.traceability_url ?? batch.traceabilityUrl ?? ''),
    total_quantity: batch.total_quantity ?? batch.totalQuantity,
  }
}

function fallbackMedia(rawImages: unknown): ProductMediaLink[] {
  if (Array.isArray(rawImages) && rawImages.length > 0) {
    const mediaLinks: ProductMediaLink[] = []

    for (let index = 0; index < rawImages.length; index += 1) {
      const image = asObject(rawImages[index])
      if (!image) {
        continue
      }

      const url = String(image.url ?? image.image_url ?? '')
      if (!url) {
        continue
      }

      mediaLinks.push({
        title: String(image.title ?? `Image ${index + 1}`),
        type: 'image',
        url,
      })
    }

    return mediaLinks
  }

  return []
}

function ensureLabel(key: string, store: Map<string, MutableLabel>, seed: PublicProductLabel): MutableLabel {
  const current = store.get(key)
  if (current) {
    return current
  }

  const next: MutableLabel = {
    categoryName: seed.category.nameVi,
    customFields: [],
    fields: [],
    lots: [],
    mediaLinks: [],
    product: seed,
  }

  store.set(key, next)
  return next
}

export function buildCatalogFromPayloads(payload: unknown): ProductCatalogEntry[] {
  const labels = new Map<string, MutableLabel>()

  const scanData = unwrapData<Record<string, unknown>>(payload)
  const scanDataObject = asObject(scanData)
  const scanProductObject = asObject(scanDataObject?.product)

  const scanObj = normalizeScanData(scanDataObject)
  const scanProduct = asObject(scanObj?.product)
  const scanBatch = asObject(scanObj?.batch)

  const rawBatches = [
    ...(Array.isArray(scanData?.batches)
      ? scanData.batches.map((item) => asObject(item)).filter((item): item is Record<string, unknown> => Boolean(item))
      : []),
    ...(Array.isArray(scanProductObject?.batches)
      ? scanProductObject.batches
          .map((item) => asObject(item))
          .filter((item): item is Record<string, unknown> => Boolean(item))
      : []),
  ]

  const rawBatchArray = [
    ...(Array.isArray(scanData?.batch)
      ? scanData.batch.map((item) => asObject(item)).filter((item): item is Record<string, unknown> => Boolean(item))
      : []),
  ]

  const scanBatches = [
    ...rawBatches,
    ...rawBatchArray,
    ...(scanBatch ? [scanBatch] : []),
  ].map(normalizeBatchItem)

  const batchTaxCode =
    scanBatches.find((batch) => String(batch.tax_code ?? '').trim())?.tax_code ?? null

  if (scanProduct) {
    const scanNbcBusiness = asObject(scanProduct.nbc_business)
    const normalizedProductAttributesDisplay = normalizeAttributesDisplay(
      scanProduct.attributes_display,
      scanProduct.attributes,
    )
    const identifierCode = String(
      scanProduct.gtin ?? scanProduct.sku ?? scanProduct.product_code ?? '',
    )
    const scanBusiness = asObject(scanProduct.business)

    const codeOwnerName = String(scanNbcBusiness?.name ?? '')
    const declarantName = String(scanBusiness?.company_name ?? scanBusiness?.name ?? codeOwnerName)
    // declarantAddress, declarantEmail, declarantPhone removed (no longer used)
    const mst = String(
      scanProduct.tax_code ??
        batchTaxCode ??
        scanNbcBusiness?.tax_code ??
        scanNbcBusiness?.business_license_number ??
        scanNbcBusiness?.enterprise_code ??
        '',
    )

    const scanCodeOwnerBusiness =
      toBusinessProfile(scanNbcBusiness, asObject(scanProduct.code_owner_business)) ??
      toBusinessProfile(asObject(scanProduct.code_owner_business), null)

    const categoryName = String(
      scanProduct.product_group_name ??
        scanProduct.brick_name ??
        scanProduct.class_name ??
        scanProduct.family_name ??
        scanProduct.segment_name ??
        '',
    )

    if (identifierCode) {
      const label = ensureLabel(
        `${identifierCode}:${mst}`,
        labels,
        {
          ...scanProduct,
          category: {
            itemNo: 1,
            nameEn: categoryName,
            nameVi: categoryName,
          },
          customFields: [],
          fields: [],
          gs1CodeOwner: scanCodeOwnerBusiness,
          identifiers: {
            gtin: identifierCode,
            publicSlug: String(scanProduct.e_label_code ?? `${identifierCode}-public`),
          },
          lots: [],
          mediaLinks: fallbackMedia(scanProduct.images),
          nbc_business: scanNbcBusiness,
          ownerOfGtin: true,
          productId: String(scanProduct.id ?? ''),
          productName: { vi: String(scanProduct.name ?? '') },
          productRecall: toRecall(scanProduct.status, scanProduct.recall_reason),
          riskLevel: (Number(scanProduct.risk_level ?? 3) as 1 | 2 | 3) || 3,
          brand: String(scanProduct.brand ?? ''),
          description: String(scanProduct.description ?? ''),
          supplierName: { vi: codeOwnerName || declarantName },
          targetMarket: { vi: String(scanProduct.target_market ?? '') },
          // tenant removed: use business/company fields only
          updatedAt: String(scanProduct.updated_at ?? ''),
          versionNo: Number(scanProduct.version ?? 0),
        },
      )

      label.fields = [
        ...toFields(normalizedProductAttributesDisplay),
      ]

      label.customFields = [
        ...toCustomFields(scanProduct.additional_attributes as AdditionalAttribute[] | undefined),
      ]

      const lots = scanBatches
        .map((batch) =>
          toLot(
            batch.batch_code as NullableString,
            batch.batch_attributes_display as AttributeDisplay[] | undefined,
            batch.additional_attributes as AdditionalAttribute[] | undefined,
            batch.manufacturing_date as NullableString,
            batch.traceability_url as NullableString,
            batch.status,
            batch.recall_reason,
            batch.is_current,
            (batch as Record<string, unknown>).total_quantity ?? (batch as Record<string, unknown>).totalQuantity,
          ),
        )
        .filter((lot): lot is ProductLot => Boolean(lot))


      label.lots = lots

      label.mediaLinks = fallbackMedia(scanProduct.images)
      label.product = {
        ...label.product,
        ...scanProduct,
        category: {
          itemNo: 1,
          nameEn: categoryName,
          nameVi: categoryName,
        },
        brand: String(scanProduct.brand ?? ''),
        customFields: label.customFields,
        description: String(scanProduct.description ?? ''),
        fields: label.fields,
        lots: label.lots,
        mediaLinks: label.mediaLinks,
        nbc_business: scanNbcBusiness,
        productId: String(scanProduct.id ?? ''),
        productName: { vi: String(scanProduct.name ?? '') },
        productRecall: toRecall(scanProduct.status, scanProduct.recall_reason),
        riskLevel: (Number(scanProduct.risk_level ?? 3) as 1 | 2 | 3) || 3,
        attributes_display: normalizedProductAttributesDisplay,
        gs1CodeOwner: scanCodeOwnerBusiness ?? label.product.gs1CodeOwner ?? null,
        supplierName: { vi: codeOwnerName || declarantName },
        // tenant removed: use business/company fields only
        updatedAt: String(scanProduct.updated_at ?? ''),
        versionNo: Number(scanProduct.version ?? 0),
      }
    }
  }

  const entriesMap = new Map<string, ProductCatalogEntry>()

  for (const mutable of labels.values()) {
    const gtin = mutable.product.identifiers.gtin
    const current = entriesMap.get(gtin)
    if (current) {
      current.organizations.push({
        ...mutable.product,
        customFields: mutable.customFields,
        fields: mutable.fields,
        lots: mutable.lots,
        mediaLinks: mutable.mediaLinks,
      })
      continue
    }

    entriesMap.set(gtin, {
      gtin,
      organizations: [
        {
          ...mutable.product,
          customFields: mutable.customFields,
          fields: mutable.fields,
          lots: mutable.lots,
          mediaLinks: mutable.mediaLinks,
        },
      ],
    })
  }

  return [...entriesMap.values()]
}

export function buildCatalogFromScanPayload(scanQrData: unknown): ProductCatalogEntry[] {
  return buildCatalogFromPayloads(scanQrData)
}

export function buildDynamicCatalog(): ProductCatalogEntry[] {
  return []
}
