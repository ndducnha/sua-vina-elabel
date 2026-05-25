import type { TFunction } from "i18next";
import { z } from "zod";

import { isBatchCodeCharacterSetValid } from "@/lib/business/batch-code";
import {
  isDdMmYyyyAfterToday,
  isValidDdMmYyyy,
} from "@/components/dynamic-form/validation";
import { getTraceabilityUrlValidation } from "@/lib/utils";
import {
  AppendixFieldInputType,
  getAppendixFieldInputType,
  type AppendixFieldRow,
} from "@/models/field.model";

import type { BatchDetailsFormValues } from "./batch-form";
import { getTraceabilityUrlHardErrorMessage } from "./traceability-url-messages";

export type CreateBatchDetailsSchemaContext = {
  t: TFunction;
  mode: "create" | "edit";
  productGtin: string;
  appendixFields: AppendixFieldRow[];
  /** When true, `traceability_url` only must start with https:// if non-empty. */
  isManualProduct?: boolean;
};

export function createBatchDetailsSchema(
  ctx: CreateBatchDetailsSchemaContext
): z.ZodType<BatchDetailsFormValues> {
  const { t, mode, productGtin, appendixFields, isManualProduct } = ctx;
  const mfgMsg = t("product.detail.batch.dialog.invalidDate");
  const mfgFutureMsg = t("product.detail.batch.dialog.mfgNotFuture");
  const req = t("product.detail.batch.dialog.fieldRequired");
  const qtyInt = t("product.detail.batch.dialog.qtyInteger");
  const qtyMin = t("product.detail.batch.dialog.qtyMinZero");
  const appendixNumberFormat = t("product.detail.batch.dialog.appendixNumberInvalidFormat");
  const batchCodeInvalidChars = t("product.detail.batch.dialog.batchCodeInvalidCharacters");

  const batchCodeSchema =
    mode === "create"
      ? z
          .string()
          .refine((s) => isBatchCodeCharacterSetValid(s), { message: batchCodeInvalidChars })
          .refine((s) => s.trim().length > 0, {
            message: t("product.detail.batch.dialog.batchCodeRequired"),
          })
      : z
          .string()
          .refine((s) => isBatchCodeCharacterSetValid(s), { message: batchCodeInvalidChars })
          .min(1, { message: t("product.detail.batch.dialog.batchCodeRequired") });

  const base = z
    .object({
      batch_code: batchCodeSchema,
      manufacturing_date: z
        .string()
        .trim()
        .min(1, { message: req })
        .refine((v) => isValidDdMmYyyy(v), { message: mfgMsg })
        .refine((v) => !isDdMmYyyyAfterToday(v), { message: mfgFutureMsg }),
      total_quantity: z
        .string()
        .refine(
          (v) => {
            const s = v.trim();
            return s === "" || /^\d+$/.test(s);
          },
          { message: qtyInt }
        )
        .refine(
          (v) => {
            const s = v.trim();
            if (s === "") return true;
            return Number(s) >= 0;
          },
          { message: qtyMin }
        ),
      traceability_url: z.string(),
      attributes: z.record(z.string(), z.string()),
      extraColumns: z.array(
        z.object({
          field_code: z.string(),
          field_name: z.string(),
          field_value: z.string(),
        })
      ),
    })
    .superRefine((data, zctx) => {
      const lot = data.batch_code.trim();
      const trace = data.traceability_url.trim();
      if (!trace) return;
      if (isManualProduct) {
        if (!trace.startsWith("https://")) {
          zctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("product.detail.batch.dialog.manualDetailUrlMustHttps"),
            path: ["traceability_url"],
          });
        }
        return;
      }
      const v = getTraceabilityUrlValidation(trace, productGtin, lot);
      if (v.result === "error") {
        zctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getTraceabilityUrlHardErrorMessage(t, v.reason),
          path: ["traceability_url"],
        });
      }
    })
    .superRefine((data, zctx) => {
      for (const f of appendixFields) {
        const path: (string | number)[] = ["attributes", f.field_id];
        const raw = (data.attributes[f.field_id] ?? "").trim();
        const dt = f.data_type?.toLowerCase() ?? "";

        if (getAppendixFieldInputType(f.data_type) === AppendixFieldInputType.Checkbox) continue;

        if (dt === "number") {
          if (!f.is_required && raw === "") continue;
          if (raw === "") {
            zctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path });
            continue;
          }
          if (!/^\d+(\.\d+)?$/.test(raw)) {
            zctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: appendixNumberFormat,
              path,
            });
          }
          continue;
        }

        if (dt === "date" || dt === "datetime") {
          if (!f.is_required && raw === "") continue;
          if (raw === "") {
            zctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path });
            continue;
          }
          if (!isValidDdMmYyyy(raw)) {
            zctx.addIssue({ code: z.ZodIssueCode.custom, message: mfgMsg, path });
          }
          continue;
        }

        if (f.is_required && raw === "") {
          zctx.addIssue({ code: z.ZodIssueCode.custom, message: req, path });
        }
      }
    });

  return base;
}
