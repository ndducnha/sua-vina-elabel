import type { ServerListQuery } from "@/components/dynamic-table";

/** Filter keys sent to GET /products (see `buildProductsListApiParams`). */
export const PRODUCT_LIST_FILTER_KEYS = {
  q: "q",
  warning: "warning",
  status: "status",
  product_group_id: "product_group_id",
} as const;

export function createProductListInitialQuery(): ServerListQuery {
  return {
    page: 1,
    pageSize: 20,
    sort: { columnId: "updated_at", desc: true },
    filters: {
      [PRODUCT_LIST_FILTER_KEYS.q]: "",
      [PRODUCT_LIST_FILTER_KEYS.warning]: "all",
      [PRODUCT_LIST_FILTER_KEYS.status]: "",
      [PRODUCT_LIST_FILTER_KEYS.product_group_id]: "",
    },
  };
}
