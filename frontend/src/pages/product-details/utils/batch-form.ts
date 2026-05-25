import type { TFunction } from "i18next";
import type { Path } from "react-hook-form";

import { FORM_FIELD_TYPE } from "@/components/dynamic-form";
import type { DynamicFormLayoutItem, FormFieldConfig } from "@/components/dynamic-form/types";
import {
  getLocalIsoDateString,
  isExpiryDate,
  isValidDdMmYyyy,
  isValidIsoDateString,
  isoDateToDdMmYyyy,
} from "@/components/dynamic-form/validation";
import { getAppendixFieldLabel, type AppendixFieldRow } from "@/models/field.model";
import type {
  CreateProductBatchBody,
  ProductBatch,
  ProductBatchAttribute,
  UpdateProductBatchBody,
} from "@/models/product-batch.model";
import {
  getBatchAttributeStringValue,
  type AdditionalAttributeColumnSpec,
} from "./batch-table";

const EXTRA_COLUMN_CODE = /^extraColumn(\d+)$/i;

export type BatchExtraColumnRow = {
  field_code: string;
  field_name: string;
  field_value: string;
};

export function isExtraColumnFieldCode(code: string | undefined | null): boolean {
  return EXTRA_COLUMN_CODE.test((code ?? "").trim());
}

export function parseExtraColumnIndex(fieldCode: string | undefined | null): number | null {
  const m = EXTRA_COLUMN_CODE.exec((fieldCode ?? "").trim());
  return m ? Number(m[1]) : null;
}

export function nextExtraColumnIndex(rows: Pick<BatchExtraColumnRow, "field_code">[]): number {
  let max = 0;
  for (const r of rows) {
    const n = parseExtraColumnIndex(r.field_code);
    if (n != null) max = Math.max(max, n);
  }
  return max + 1;
}

/**
 * Edit dialog extras: match current batch table (`columnSpecs` order / labels),
 * merge values from the batch being edited, then append any extra batch attributes
 * missing from columns (different page keys, etc.).
 */
export function buildDefaultExtraColumnsForEdit(
  batch: ProductBatch,
  columnSpecs: AdditionalAttributeColumnSpec[]
): BatchExtraColumnRow[] {
  const byCode = new Map<string, { field_name: string; field_value: string }>();
  for (const a of batch.additional_attributes ?? []) {
    const code = (a.field_code ?? "").trim();
    if (!code || byCode.has(code)) continue;
    byCode.set(code, {
      field_name: a.field_name?.trim() ?? "",
      field_value: a.field_value?.trim() ?? "",
    });
  }

  const specSeen = new Set<string>();
  const rows: BatchExtraColumnRow[] = [];

  for (const spec of columnSpecs) {
    const code = spec.fieldCode.trim();
    if (!code || specSeen.has(code)) continue;
    specSeen.add(code);
    const fromBatch = byCode.get(code);
    const label = spec.headerLabel?.trim() ?? "";
    rows.push({
      field_code: code,
      field_name:
        fromBatch != null && fromBatch.field_name.trim() !== ""
          ? fromBatch.field_name.trim()
          : label || code,
      field_value: fromBatch?.field_value ?? "",
    });
  }

  for (const a of batch.additional_attributes ?? []) {
    const code = (a.field_code ?? "").trim();
    if (!code || specSeen.has(code)) continue;
    specSeen.add(code);
    rows.push({
      field_code: code,
      field_name: a.field_name?.trim() ?? "",
      field_value: a.field_value?.trim() ?? "",
    });
  }

  return rows;
}

/**
 * When adding a batch, seed `extraColumns` from dynamic table column specs (same order /
 * labels as the list), matching the edit dialog behaviour.
 */
export function buildDefaultExtraColumnsForCreate(
  columnSpecs: AdditionalAttributeColumnSpec[]
): BatchExtraColumnRow[] {
  const seen = new Set<string>();
  const rows: BatchExtraColumnRow[] = [];
  for (const spec of columnSpecs) {
    const code = spec.fieldCode.trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    const label = spec.headerLabel?.trim() ?? "";
    rows.push({
      field_code: code,
      field_name: label || code,
      field_value: "",
    });
  }
  return rows;
}

/**
 * Payload `additional_attributes` from user extra rows.
 * A row is included when `field_name` (after trim) is non-empty; `field_value` may be empty.
 */
export function buildAdditionalAttributesFromExtraColumns(
  rows: BatchExtraColumnRow[]
): ProductBatchAttribute[] {
  return rows
    .map((r) => ({
      field_code: r.field_code.trim(),
      field_name: r.field_name.trim(),
      field_value: r.field_value.trim(),
    }))
    .filter((r) => r.field_name !== "");
}

export function toApiDateString(value: string): string {
  const s = value.trim();
  if (!s) return "";
  if (isValidDdMmYyyy(s)) return s;
  if (isValidIsoDateString(s)) return isoDateToDdMmYyyy(s);
  return s;
}

/**
 * Parse API `manufacturing_date` (ISO prefix, full ISO date, or DD/MM/YYYY) to a local calendar
 * `Date` without relying on `new Date ambiguous string` for the common formats.
 */
export function parseManufacturingDateToLocalDate(raw: string): Date | null {
  const t = raw?.trim() ?? "";
  if (!t) return null;

  const isoPrefix = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefix) {
    const y = Number(isoPrefix[1]);
    const mo = Number(isoPrefix[2]) - 1;
    const day = Number(isoPrefix[3]);
    const d = new Date(y, mo, day);
    if (d.getFullYear() === y && d.getMonth() === mo && d.getDate() === day) {
      return d;
    }
  }

  if (isValidDdMmYyyy(t)) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t)!;
    const day = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const y = Number(m[3]);
    const d = new Date(y, mo, day);
    if (d.getFullYear() === y && d.getMonth() === mo && d.getDate() === day) {
      return d;
    }
  }

  if (isValidIsoDateString(t)) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t.trim())!;
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const day = Number(m[3]);
    const d = new Date(y, mo, day);
    if (d.getFullYear() === y && d.getMonth() === mo && d.getDate() === day) {
      return d;
    }
  }

  return null;
}

/**
 * Map API manufacturing date to `DD/MM/YYYY` for batch form defaults (edit dialog).
 */
export function apiManufacturingDateToFormDdMmYyyy(input: string | undefined | null): string {
  const t = input?.trim() ?? "";
  if (!t) return "";

  const isoPrefix = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoPrefix) {
    return `${isoPrefix[3]}/${isoPrefix[2]}/${isoPrefix[1]}`;
  }
  if (isValidDdMmYyyy(t)) return t;
  if (isValidIsoDateString(t)) return isoDateToDdMmYyyy(t);

  const parsed = parseManufacturingDateToLocalDate(t);
  if (parsed) {
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${day}/${mo}/${y}`;
  }

  const fallback = new Date(t);
  if (!Number.isNaN(fallback.getTime())) {
    const y = fallback.getFullYear();
    const mo = String(fallback.getMonth() + 1).padStart(2, "0");
    const day = String(fallback.getDate()).padStart(2, "0");
    return `${day}/${mo}/${y}`;
  }

  return t;
}

/** Table cell: locale-formatted manufacturing date, or em dash / raw fallback. */
export function formatManufacturingDateForTableCell(raw: string, lang: string): string {
  if (!raw?.trim()) {
    return "—";
  }
  const d = parseManufacturingDateToLocalDate(raw);
  if (!d) {
    return raw.trim();
  }
  const locale = lang === "vi" ? "vi-VN" : "en-GB";
  return d.toLocaleDateString(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Lot appendix as API `attributes`: map `field_id` (field code) → value string.
 * Date / datetime field values are sent as `DD/MM/YYYY` where applicable.
 */
export function buildAppendixAttributesForApi(
  appendixFields: AppendixFieldRow[],
  attributes: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of [...appendixFields].sort((a, b) => a.display_order - b.display_order)) {
    const raw = (attributes[f.field_id] ?? "").trim();
    const dt = f.data_type?.toLowerCase() ?? "";
    const valueForApi =
      dt === "date" || dt === "datetime" ? toApiDateString(raw) : raw;
    out[f.field_id.trim()] = valueForApi;
  }
  return out;
}

type ProductBatchPayloadCore = Omit<CreateProductBatchBody, "product_id">;

function buildProductBatchPayloadCore(
  values: BatchDetailsFormValues,
  appendixFields: AppendixFieldRow[],
  additional_attributes: ProductBatchAttribute[]
): ProductBatchPayloadCore {
  const mfg = toApiDateString(values.manufacturing_date);
  const qtyRaw = values.total_quantity.trim();
  const parsedQty = qtyRaw === "" ? 0 : Number(qtyRaw);
  const total_quantity = Number.isFinite(parsedQty) ? parsedQty : 0;
  const trace = values.traceability_url.trim();

  return {
    batch_code: values.batch_code.trim(),
    manufacturing_date: mfg,
    total_quantity,
    traceability_url: trace === "" ? null : trace,
    attributes: buildAppendixAttributesForApi(appendixFields, values.attributes),
    additional_attributes,
  };
}

export function buildCreateProductBatchPayload(
  productId: string,
  values: BatchDetailsFormValues,
  appendixFields: AppendixFieldRow[],
  additional_attributes: ProductBatchAttribute[]
): CreateProductBatchBody {
  return {
    ...buildProductBatchPayloadCore(values, appendixFields, additional_attributes),
    product_id: productId,
  };
}

export function buildUpdateProductBatchPayload(
  values: BatchDetailsFormValues,
  appendixFields: AppendixFieldRow[],
  additional_attributes: ProductBatchAttribute[],
  inter_industry_attributes: ProductBatchAttribute[]
): UpdateProductBatchBody {
  return {
    ...buildProductBatchPayloadCore(values, appendixFields, additional_attributes),
    inter_industry_attributes,
  };
}

/** Values for add/edit lot dialog (default + appendix fields stored under `attributes`). */
export type BatchDetailsFormValues = {
  batch_code: string;
  manufacturing_date: string;
  total_quantity: string;
  traceability_url: string;
  attributes: Record<string, string>;
  extraColumns: BatchExtraColumnRow[];
};

type PathAttr = `attributes.${string}` & Path<BatchDetailsFormValues>;

export function mapAppendixFieldsToFormLayout(
  t: TFunction,
  fields: AppendixFieldRow[],
  locale?: string
): DynamicFormLayoutItem<BatchDetailsFormValues>[] {
  if (fields.length === 0) return [];
  return [
    {
      block: "section",
      contentClassName: "grid w-full grid-cols-1 gap-4 md:grid-cols-1",
      fields: fields
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((f) => toFormField(f, t, locale)),
    },
  ];
}

function toFormField(
  f: AppendixFieldRow,
  t: TFunction,
  locale: string | undefined
): FormFieldConfig<BatchDetailsFormValues> {
  const label = getAppendixFieldLabel(f, locale);
  const name: PathAttr = `attributes.${f.field_id}` as PathAttr;
  const dataType = f.data_type?.toLowerCase() ?? "";

  if (dataType === "bool" || dataType === "boolean") {
    return {
      type: FORM_FIELD_TYPE.TEXT,
      name,
      label,
      required: false,
    };
  }

  if (dataType === "number") {
    return {
      type: FORM_FIELD_TYPE.TEXT,
      name,
      label,
      required: f.is_required ? t("product.detail.batch.dialog.fieldRequired") : false,
      inputType: "number",
    };
  }

  if (dataType === "date" || dataType === "datetime") {
    return {
      type: FORM_FIELD_TYPE.DATE,
      name,
      label,
      placeholder: t("product.detail.batch.datePlaceholder"),
      required: f.is_required ? t("product.detail.batch.dialog.fieldRequired") : false,
      ...(isExpiryDate(label) ? { datePickerMin: getLocalIsoDateString() } : {}),
    };
  }

  return {
    type: FORM_FIELD_TYPE.TEXT,
    name,
    label,
    required: f.is_required ? t("product.detail.batch.dialog.fieldRequired") : false,
  };
}

export function buildDefaultAttributes(
  mode: "create" | "edit",
  batch: ProductBatch | null,
  appendixFields: AppendixFieldRow[]
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of appendixFields) {
    if (mode === "edit" && batch) {
      out[f.field_id] = getBatchAttributeStringValue(batch, f.field_id);
    } else {
      out[f.field_id] = "";
    }
  }
  return out;
}
