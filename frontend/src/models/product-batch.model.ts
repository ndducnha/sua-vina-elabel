import type { ApiEnvelope } from "@/models/api.model";

/** Query for `GET /products/{id}/batches` (page, limit, filters). */
export type ProductBatchesListQueryParams = {
  page: number;
  limit: number;
} & Record<string, string | number | string[] | boolean | undefined>;

export type ProductBatchAttribute = {
  field_code: string;
  field_name: string;
  field_value: string;
};

export type CreateProductBatchBody = {
  product_id: string;
  batch_code: string;
  manufacturing_date: string;
  total_quantity: number;
  traceability_url: string | null;
  attributes: Record<string, string>;
  additional_attributes: ProductBatchAttribute[];
};

export type UpdateProductBatchBody = {
  batch_code: string;
  manufacturing_date: string;
  total_quantity: number;
  traceability_url: string | null;
  attributes: Record<string, string>;
  additional_attributes: ProductBatchAttribute[];
  inter_industry_attributes: ProductBatchAttribute[];
};

export type ProductBatch = {
  id: string;
  product_id: string;
  root_batch_id?: string;
  batch_code: string;
  manufacturing_date: string;
  total_quantity: number;
  status: string;
  is_current: boolean;
  is_allowed_scan?: boolean;
  traceability_url: string;
  e_label_code: string;
  tax_code: string;
  version: number;
  created_at: string;
  updated_at: string;
  recall_reason?: string;
  additional_attributes: ProductBatchAttribute[];
  inter_industry_attributes: ProductBatchAttribute[];
  attributes: Record<string, unknown>;
};

export const BatchStatus = {
  DRAFT: "draft",
  PUBLISHED: "published",
  RECALLED: "recalled",
} as const;

export type BatchStatus = (typeof BatchStatus)[keyof typeof BatchStatus];

export type UpdateProductBatchStatusBody = {
  status: typeof BatchStatus.PUBLISHED | typeof BatchStatus.RECALLED;
  recall_reason?: string;
};

/** `PATCH .../batches/bulk/status` */
export type BulkUpdateBatchStatusBody = {
  batch_ids: string[];
  status: string;
  recall_reason?: string;
};

/** `DELETE .../batches/bulk/delete` */
export type BulkDeleteBatchesBody = {
  batch_ids: string[];
};

/** `POST .../batches/bulk/qr-job` request body */
export type BulkBatchQrJobBody = {
  batch_ids: string[];
};

/** `data` inside envelope for queued bulk QR job */
export type BulkBatchQrJobData = {
  qr_job_id: string;
};

/** Map API / free-form `status` string to `BatchStatus` (default draft). */
export function parseProductBatchStatus(raw: string | null | undefined): BatchStatus {
  const s = raw?.trim().toLowerCase() ?? "";
  if (s === BatchStatus.PUBLISHED) return BatchStatus.PUBLISHED;
  if (s === BatchStatus.RECALLED) return BatchStatus.RECALLED;
  return BatchStatus.DRAFT;
}

export type DeleteProductBatchData = {
  deleted: boolean;
};

/** Paginated batch list in `GET /products/{id}/batches` envelope `data`. */
export type ProductBatchesListPageData = {
  items: ProductBatch[];
  limit: number;
  page: number;
  total: number;
  total_pages: number;
};

export type ProductBatchesListResponse = ApiEnvelope<ProductBatchesListPageData>;
