import type { TFunction } from "i18next";

/** Map numeric risk_level → translated label + badge colour classes. */
export function getRiskBadge(t: TFunction, level: number | undefined | null) {
  if (level === 3) {
    return {
      label: t("product.detail.info.riskLow"),
      cls: "bg-success-50 text-success-500 border border-success-200",
    };
  }
  if (level === 2) {
    return {
      label: t("product.detail.info.riskMedium"),
      cls: "bg-warning-50 text-warning-500 border border-warning-200",
    };
  }
  if (level === 1) {
    return {
      label: t("product.detail.info.riskHigh"),
      cls: "bg-error-50 text-error-500 border border-error-200",
    };
  }
  if (level === 0) {
    return {
      label: t("product.detail.info.riskUndetermined"),
      cls: "bg-muted-50 text-muted-500 border border-muted-200",
    };
  }
  return null;
}

export function getRiskLevelLabel(level: number) {
  switch (level) {
    case 3:
      return "product.detail.info.riskLow";
    case 2:
      return "product.detail.info.riskMedium";
    case 1:
      return "product.detail.info.riskHigh";
    case 0:
      return "product.detail.info.riskUndetermined";
  }
  return "product.detail.info.riskUndetermined";
}