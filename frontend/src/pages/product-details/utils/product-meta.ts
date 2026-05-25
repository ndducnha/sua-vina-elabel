import type { AttributeDisplay, DynamicField, Product } from "@/models/product.model";
import { AppendixFieldInputType, getAppendixFieldInputType } from "@/models/field.model";

/** Format the metadata footer string per EC2 spec. */
export function formatProductMeta(product: Product): string {
  const isCreatedOnlyVersion =
    product.version === 1 && product.updated_at === product.created_at;

  const date = new Date(product.updated_at);
  const formatted = date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (isCreatedOnlyVersion) {
    return `Ngày tạo: ${formatted} · v1`;
  }
  return `Cập nhật lần cuối: ${formatted} · v${product.version}`;
}

/** Render null/undefined/empty string as "—". */
export function val(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s || "—";
}

/** Appendix/checkbox values are stored as `"true"`; show the field label instead of the literal on detail views. */
export function formatTruthyAttributeDisplayValue(fieldLabel: string, value: string): string {
  const v = value.trim();
  if (v.toLowerCase() !== "true") return value;
  const label = fieldLabel.trim();
  return label || value;
}

/**
 * Appendix attributes on product/batch views: bool `false` → empty dash; bool `true` → label (same as truthy formatting).
 * When `fieldType` is omitted, only non-bool behavior applies (see `formatTruthyAttributeDisplayValue`).
 */
export function formatAppendixDisplayValue(
  fieldLabel: string,
  value: string,
  fieldType?: string | null,
): string {
  const v = value.trim();
  if (getAppendixFieldInputType(fieldType) === AppendixFieldInputType.Checkbox) {
    const lower = v.toLowerCase();
    if (lower === "true" || v === "1") {
      const label = fieldLabel.trim();
      return label || value;
    }
    if (lower === "false" || lower === "0" || lower === "no" || v === "") {
      return "—";
    }
    return value;
  }
  return formatTruthyAttributeDisplayValue(fieldLabel, value);
}

/** Look up a DynamicField by field_code or field_name from a list and returns the field_value or "—" if not found. */
export function findAttr(arrays: DynamicField[][], ...codes: string[]): string {
  for (const arr of arrays) {
    if (!arr) continue;
    for (const code of codes) {
      const lowerCode = code.toLowerCase();
      const found = arr.find(
        (f) => f.field_code === code || f.field_name.toLowerCase() === lowerCode
      );
      if (found?.field_value?.trim()) return found.field_value.trim();
    }
  }
  return "—";
}

export type DynamicInfoRow = { label: string; value: string; preWrap: boolean };

function formatAttributeRaw(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number" || typeof raw === "boolean") return String(raw);
  if (typeof raw === "object") {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  return String(raw);
}

function resolveDisplayValue(
  d: AttributeDisplay,
  attrs: Record<string, unknown>
): string {
  const fromAttr = formatAttributeRaw(attrs[d.field_key]);
  if (fromAttr) return fromAttr;
  const fromDisplay = (d.value ?? "").toString().trim();
  return fromDisplay;
}

export function buildDynamicAttributeRows(product: Product): DynamicInfoRow[] {
  const attrs =
    product.attributes && typeof product.attributes === "object"
      ? product.attributes
      : {};
  const displays = product.attributes_display;
  const rows: DynamicInfoRow[] = [];

  if (displays?.length) {
    for (const d of displays) {
      if (!d.field_key?.trim()) continue;
      const label = d.label_vi?.trim() || d.field_key;
      let value = resolveDisplayValue(d, attrs);
      if (!value) continue;
      value = formatAppendixDisplayValue(label, value, d.field_type);
      const preWrap =
        d.field_type === "json" || value.includes("\n") || value.length > 200;
      rows.push({ label, value, preWrap });
    }
  } else {
    const keys = Object.keys(attrs).sort();
    for (const key of keys) {
      const raw = attrs[key];
      let value = formatAttributeRaw(raw);
      if (!value) continue;
      const boolHint: string | undefined =
        typeof raw === "boolean" ? AppendixFieldInputType.Checkbox : undefined;
      value = formatAppendixDisplayValue(key, value, boolHint);
      rows.push({
        label: key,
        value,
        preWrap: value.includes("\n") || value.length > 200,
      });
    }
  }

  for (const f of product.additional_attributes ?? []) {
    const label = f.field_name?.trim() || f.field_code;
    let v = f.field_value?.trim();
    if (!v) continue;
    v = formatTruthyAttributeDisplayValue(label, v);
    rows.push({
      label,
      value: v,
      preWrap: v.includes("\n") || v.length > 200,
    });
  }

  return rows;
}
