import type { ProductBatch } from "@/models/product-batch.model";

export type AdditionalAttributeColumnSpec = {
  fieldCode: string;
  /** From the first non-empty `field_name` seen for that code. */
  headerLabel: string;
};

/**
 * Build stable column list: order follows first appearance across `items`, left-to-right.
 */
export function collectAdditionalAttributeColumnSpecs(
  items: ProductBatch[]
): AdditionalAttributeColumnSpec[] {
  const order: string[] = [];
  const headerByCode = new Map<string, string>();
  for (const batch of items) {
    for (const a of batch.additional_attributes ?? []) {
      const code = a.field_code?.trim() ?? "";
      if (!code) continue;
      if (!headerByCode.has(code)) {
        order.push(code);
        const name = a.field_name?.trim() ?? "";
        headerByCode.set(code, name || code);
      }
    }
  }
  return order.map((code) => ({
    fieldCode: code,
    headerLabel: headerByCode.get(code) ?? code,
  }));
}

export function getAdditionalAttributeCellValue(
  batch: ProductBatch,
  fieldCode: string
): string {
  const want = fieldCode.trim();
  if (!want) return "";
  for (const a of batch.additional_attributes ?? []) {
    if ((a.field_code?.trim() ?? "") === want) {
      return a.field_value?.trim() ?? "";
    }
  }
  return "";
}

const EXPIRY_FIELD_HINTS = /EXPIR|BEST_BEFORE|HSD|HẠN|USE.BY|USE_BY/i;

export function getBatchExpiryDateDisplay(batch: ProductBatch): string | null {
  const list = [
    ...(batch.additional_attributes ?? []),
    ...(batch.inter_industry_attributes ?? []),
  ];
  for (const attr of list) {
    if (
      EXPIRY_FIELD_HINTS.test(attr.field_code ?? "") ||
      EXPIRY_FIELD_HINTS.test(attr.field_name ?? "")
    ) {
      const v = attr.field_value?.trim();
      if (v) return v;
    }
  }
  return null;
}

/**
 * Read appendix / structured lot attribute from `ProductBatch.attributes` (API key = `field_id`).
 */
export function getBatchAttributeStringValue(
  batch: ProductBatch,
  fieldId: string
): string {
  const map = batch.attributes;
  if (!map || typeof map !== "object") return "";
  const v = (map as Record<string, unknown>)[fieldId];
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
