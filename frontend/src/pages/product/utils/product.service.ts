import { fetchProductsList } from "@/api/product";
import {
  buildApiQueryParamsFromDynamicFilters,
  type DynamicFilterField,
  type ServerListQuery,
} from "@/components/dynamic-table";
import {
  type PagedResult,
  type Product,
  type ProductsListApiParams,
  type ProductsListPageData,
  serverSortToProductsApiParams,
} from "@/models/product.model";

function buildProductsListApiParams(
  query: ServerListQuery,
  filterFields: DynamicFilterField[]
): ProductsListApiParams {
  const limit = Math.min(500, Math.max(1, query.pageSize));
  const page = Math.max(1, query.page);

  const fromFilters = buildApiQueryParamsFromDynamicFilters(filterFields, query.filters);

  const api: Record<string, string | number | boolean | string[]> = {
    page,
    limit,
    summary: true,
    ...serverSortToProductsApiParams(query.sort),
    ...fromFilters,
  };

  if (Array.isArray(api.status)) {
    if (api.status.length) {
      api.status = api.status.join(",");
    } else {
      delete api.status;
    }
  }
  if (Array.isArray(api.product_group_id)) {
    if (api.product_group_id.length) {
      api.product_group_id = api.product_group_id.join(",");
    } else {
      delete api.product_group_id;
    }
  }

  return api as ProductsListApiParams;
}

function toPagedResult(body: ProductsListPageData): PagedResult<Product> {
  const items = body.items ?? [];
  const total = typeof body.total === "number" && body.total >= 0 ? body.total : 0;
  return { items, total, summary: body.summary ?? null };
}

export function fetchProductsPage(
  query: ServerListQuery,
  filterFields: DynamicFilterField[]
): Promise<PagedResult<Product>> {
  const params = buildProductsListApiParams(query, filterFields);
  return fetchProductsList(params).then(({ data: envelope }) => toPagedResult(envelope.data));
}
