import type { TFunction } from "i18next";

import type { MobileSortColumnOption } from "@/components/dynamic-table";
import { UserMode } from "@/models/auth.model";

export const PRODUCT_MOBILE_SORT_COLUMN_IDS = [
  "gtin",
  "product_name",
  "batch_count",
  "created_at",
  "updated_at",
] as const;

export type ProductMobileSortColumnId = (typeof PRODUCT_MOBILE_SORT_COLUMN_IDS)[number];

const COLUMN_I18N_KEY: Record<ProductMobileSortColumnId, string> = {
  gtin: "product.table.gtin",
  product_name: "product.table.productName",
  batch_count: "product.table.batchCount",
  created_at: "product.table.createdAt",
  updated_at: "product.table.updatedAt",
};

export function getProductMobileSortColumns(
  t: TFunction,
  userMode: UserMode,
): MobileSortColumnOption[] {
  return PRODUCT_MOBILE_SORT_COLUMN_IDS.map((id) => ({
    id,
    label:
      id === "gtin"
        ? userMode === UserMode.VNPC
          ? t("product.table.gtin")
          : t("product.table.identifier")
        : t(COLUMN_I18N_KEY[id]),
  }));
}
