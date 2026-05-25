import { isAxiosError } from "axios";

import axiosInstance from "@/api/interceptors/axios-instance";
import { API_ENDPOINTS } from "@/api/endpoints";
import {
  isValidDdMmYyyy,
  isValidIsoDateString,
  isoDateToDdMmYyyy,
} from "@/components/dynamic-form/validation";
import {
  buildApiQueryParamsFromDynamicFilters,
  type DynamicFilterField,
  type ServerListQuery,
} from "@/components/dynamic-table";
import type { ApiEnvelope } from "@/models/api.model";
import type { PagedResult } from "@/models/product.model";
import {
  type BulkBatchQrJobBody,
  type BulkBatchQrJobData,
  type BulkDeleteBatchesBody,
  type BulkUpdateBatchStatusBody,
  type CreateProductBatchBody,
  type DeleteProductBatchData,
  type ProductBatch,
  type ProductBatchesListQueryParams,
  type ProductBatchesListResponse,
  type UpdateProductBatchBody,
  type UpdateProductBatchStatusBody,
} from "@/models/product-batch.model";

const MFG_FROM = "manufacturing_date_from";
const MFG_TO = "manufacturing_date_to";

/** API list filters expect `DD/MM/YYYY`; table date inputs use `YYYY-MM-dd`. */
function toManufacturingDateQueryParam(v: string | undefined): string | undefined {
  const t = v?.trim();
  if (!t) return undefined;
  if (isValidDdMmYyyy(t)) return t;
  if (isValidIsoDateString(t)) return isoDateToDdMmYyyy(t);
  return undefined;
}

function buildProductBatchesListQueryParams(
  query: ServerListQuery,
  filterFields: DynamicFilterField[]
): ProductBatchesListQueryParams {
  const limit = Math.min(500, Math.max(1, query.pageSize));
  const page = Math.max(1, query.page);

  const fromFilters = buildApiQueryParamsFromDynamicFilters(filterFields, query.filters);

  const rawFrom = fromFilters[MFG_FROM];
  const rawTo = fromFilters[MFG_TO];
  const mfgFrom = toManufacturingDateQueryParam(
    typeof rawFrom === "string" ? rawFrom : undefined
  );
  const mfgTo = toManufacturingDateQueryParam(typeof rawTo === "string" ? rawTo : undefined);

  const out: ProductBatchesListQueryParams = {
    page,
    limit,
  };

  for (const [key, val] of Object.entries(fromFilters)) {
    if (key === MFG_FROM || key === MFG_TO) continue;
    (out as Record<string, string | string[] | number | boolean | undefined>)[key] = val;
  }
  if (mfgFrom) out[MFG_FROM] = mfgFrom;
  if (mfgTo) out[MFG_TO] = mfgTo;

  if (query.sort?.columnId === "manufacturing_date") {
    out.sort_dir = query.sort.desc ? "desc" : "asc";
  }

  return out;
}

export function createProductBatch(productId: string, body: CreateProductBatchBody) {
  return axiosInstance.post<ApiEnvelope<ProductBatch>>(API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES(productId), body);
}

export function updateProductBatch(productId: string, batchId: string, body: UpdateProductBatchBody) {
  return axiosInstance.patch<ApiEnvelope<ProductBatch>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES(productId, batchId),
    body
  );
}

export function updateProductBatchStatus(
  productId: string,
  batchId: string,
  body: UpdateProductBatchStatusBody
) {
  return axiosInstance.patch<ApiEnvelope<ProductBatch>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCH_STATUS(productId, batchId),
    body
  );
}

export function deleteProductBatch(productId: string, batchId: string) {
  return axiosInstance.delete<ApiEnvelope<DeleteProductBatchData>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES(productId, batchId)
  );
}

/** Infer how many batches were updated from bulk status `data` (array, items, or counts). */
function countBulkStatusResultData(data: unknown): number {
  if (data == null) return 0;
  if (Array.isArray(data)) return data.length;
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.updated_count === "number" && Number.isFinite(o.updated_count)) {
      return o.updated_count;
    }
    if (Array.isArray(o.items)) return o.items.length;
    if (Array.isArray(o.batches)) return o.batches.length;
  }
  return 0;
}

/**
 * `PATCH /products/{productId}/batches/bulk/status`
 * @returns number of batches reported as updated (best-effort from response shape).
 */
export async function bulkUpdateProductBatchStatus(
  productId: string,
  body: BulkUpdateBatchStatusBody
): Promise<number> {
  const id = productId.trim();
  const { data: envelope } = await axiosInstance.patch<ApiEnvelope<unknown>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES_BULK_STATUS(id),
    body
  );
  return countBulkStatusResultData(envelope?.data);
}

/** `DELETE /products/{productId}/batches/bulk/delete` */
export function bulkDeleteProductBatches(productId: string, body: BulkDeleteBatchesBody) {
  const id = productId.trim();
  return axiosInstance.delete<ApiEnvelope<DeleteProductBatchData>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES_BULK_DELETE(id),
    { data: body }
  );
}

/** `POST /products/{productId}/batches/bulk/qr-job` — enqueue background QR bundle for batch rows */
export function enqueueBulkBatchQrJob(productId: string, body: BulkBatchQrJobBody) {
  const id = productId.trim();
  return axiosInstance.post<ApiEnvelope<BulkBatchQrJobData>>(
    API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES_BULK_QR_JOB(id),
    body
  );
}

/**
 * `GET /products/{productId}/batches/by-code?batch_code=...`
 * @returns the batch if found, `null` if 404 (not found for this product line).
 */
export function fetchProductBatchByCode(
  productId: string,
  batchCode: string,
  signal?: AbortSignal
): Promise<ProductBatch | null> {
  const id = productId.trim();
  const code = batchCode.trim();
  if (!id || !code) {
    return Promise.resolve(null);
  }
  return axiosInstance
    .get<ApiEnvelope<ProductBatch>>(
      API_ENDPOINTS.PRODUCTS.PRODUCT_BATCH_BY_CODE(id),
      {
        params: { batch_code: code },
        signal,
        skipGlobalErrorToast: true,
      }
    )
    .then((response) => {
      const data = response.data?.data;
      return data && typeof (data as ProductBatch).id === "string" ? (data as ProductBatch) : null;
    })
    .catch((error) => {
      if (isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      throw error;
    });
}

/** `GET /products/{productId}/batches` 
 * @returns Paged result of product batches.
*/
export function fetchProductBatchesPage(
  productId: string,
  query: ServerListQuery,
  filterFields: DynamicFilterField[]
): Promise<PagedResult<ProductBatch>> {
  const params = buildProductBatchesListQueryParams(query, filterFields);
  const id = productId.trim();
  return axiosInstance
    .get<ProductBatchesListResponse>(API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES(id), { params })
    .then(({ data: envelope }) => {
      const pageData = envelope.data;
      const items = Array.isArray(pageData?.items) ? pageData.items : [];
      const total = typeof pageData?.total === "number" ? pageData.total : 0;
      return { items, total, summary: null };
    });
}

export type {
  BulkBatchQrJobBody,
  BulkBatchQrJobData,
  BulkDeleteBatchesBody,
  BulkUpdateBatchStatusBody,
  CreateProductBatchBody,
  DeleteProductBatchData,
  ProductBatch,
  ProductBatchesListQueryParams,
  ProductBatchesListResponse,
  UpdateProductBatchBody,
  UpdateProductBatchStatusBody,
} from "@/models/product-batch.model";
