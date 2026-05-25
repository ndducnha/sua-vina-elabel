import type { ApiEnvelope } from "@/models/api.model";

/** `fields.scope` — GET /fields query param. */
export type FieldScope = "product" | "lot";

/** One row in GET /fields `data` (ordered by `display_order`). */
export type AppendixFieldRow = {
  data_type: string;
  display_order: number;
  field_id: string;
  field_name_en: string;
  field_name_vi: string;
  is_required: boolean;
  notes: string;
  scope: string;
};

/** How a product appendix (`requiredFields`) row is edited in the UI. */
export const AppendixFieldInputType = {
  Text: "text",
  Checkbox: "checkbox",
  Date: "date",
} as const;

export type AppendixFieldInputTypeValue =
  (typeof AppendixFieldInputType)[keyof typeof AppendixFieldInputType];

/** Map API `data_type` to form control (extend object + branch when new types are added). */
export function getAppendixFieldInputType(
  dataType: string | null | undefined,
): AppendixFieldInputTypeValue {
  const t = String(dataType ?? "").trim().toLowerCase();
  if (t === "bool" || t === "boolean") return AppendixFieldInputType.Checkbox;
  if (t === "date" || t === "datetime") return AppendixFieldInputType.Date;
  return AppendixFieldInputType.Text;
}

export type FieldsByAppendixApiResponse = ApiEnvelope<AppendixFieldRow[]>;


export function getAppendixFieldLabel(
  f: AppendixFieldRow,
  lang: string | undefined
): string {
  const base = (lang ?? "vi").split("-")[0]?.toLowerCase() ?? "vi";
  if (base === "vi") {
    return f.field_name_vi?.trim() || f.field_name_en?.trim() || f.field_id;
  }
  return f.field_name_en?.trim() || f.field_name_vi?.trim() || f.field_id;
}
