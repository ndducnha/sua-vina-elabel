import type { TFunction } from "i18next";

import type { DynamicTableSummaryItem } from "@/components/dynamic-table";
import type { ProductsListSummary } from "@/models/product.model";

/** Maps GET /products `data.summary` metrics into `DynamicTableSummaryBar` items. */
export function buildProductSummaryBarItems(
  summary: ProductsListSummary | null,
  filteredTotal: number,
  t: TFunction
): DynamicTableSummaryItem[] {
  if (!summary) {
    return [{ id: "total", label: t("product.summary.totalProducts"), value: filteredTotal }];
  }

  const totalProducts =
    summary.product_count > 0 ? summary.product_count : filteredTotal;

  return [
    { id: "total", label: t("product.summary.totalProducts"), value: totalProducts },
    {
      id: "labels",
      label: t("product.summary.electronicLabels"),
      value: summary.qr_code_count,
    },
    {
      id: "active",
      label: t("product.summary.active"),
      value: summary.active_product_count,
      tone: "success",
    },
  ];
}
