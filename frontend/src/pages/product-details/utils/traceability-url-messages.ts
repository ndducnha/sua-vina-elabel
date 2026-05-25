import type { TFunction } from "i18next";

import {
  FIELD_VALIDATION_PHASE,
  type FieldValidationState,
} from "@/components/dynamic-form/types";
import { getTraceabilityUrlValidation, type TraceabilityUrlHardErrorReason } from "@/lib/utils";

/**
 * i18n for hard blockers on traceability_url (Zod + inline, must match getTraceabilityUrlValidation).
 */
export function getTraceabilityUrlHardErrorMessage(
  t: TFunction,
  reason: TraceabilityUrlHardErrorReason
): string {
  switch (reason) {
    case "domain":
      return t("product.detail.batch.dialog.traceabilityUrlInvalidDomain");
    case "gtin":
      return t("product.detail.batch.dialog.traceabilityUrlGtinMismatch");
    case "path":
      return t("product.detail.batch.dialog.traceabilityUrlInvalidPath");
    case "parse":
    default:
      return t("product.detail.batch.dialog.traceabilityUrlInvalidFormat");
  }
}

export function getTraceabilityUrlSoftLotWarningMessage(t: TFunction): string {
  return t("product.detail.batch.dialog.traceabilityUrlLotMismatchWarning");
}

/** Manual product: non-empty value must start with `https://`. */
export function getManualDetailLinkFieldValidationState(
  t: TFunction,
  rawUrl: string
): FieldValidationState {
  const trimmed = (rawUrl ?? "").trim();
  if (trimmed === "") {
    return { phase: FIELD_VALIDATION_PHASE.NEUTRAL };
  }
  if (!trimmed.startsWith("https://")) {
    return {
      phase: FIELD_VALIDATION_PHASE.ERROR,
      message: t("product.detail.batch.dialog.manualDetailUrlMustHttps"),
    };
  }
  return { phase: FIELD_VALIDATION_PHASE.SUCCESS };
}

/** Lot code = batch series in create, or `lotCodeForEdit` in edit. */
export function getTraceabilityFieldValidationState(
  t: TFunction,
  traceabilityUrl: string,
  productGtin: string,
  lotCode: string
): FieldValidationState {
  const v = getTraceabilityUrlValidation(traceabilityUrl, productGtin, lotCode);
  if (v.result === "empty") {
    return { phase: FIELD_VALIDATION_PHASE.NEUTRAL };
  }
  if (v.result === "error") {
    return {
      phase: FIELD_VALIDATION_PHASE.ERROR,
      message: getTraceabilityUrlHardErrorMessage(t, v.reason),
    };
  }
  if (v.result === "lot_warning") {
    return {
      phase: FIELD_VALIDATION_PHASE.WARNING,
      message: getTraceabilityUrlSoftLotWarningMessage(t),
    };
  }
  return { phase: FIELD_VALIDATION_PHASE.SUCCESS };
}
