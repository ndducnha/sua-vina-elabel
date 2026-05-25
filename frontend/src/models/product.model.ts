import type { ServerSortState } from "@/components/dynamic-table";
import type { ApiEnvelope } from "@/models/api.model";

/** Inline shape replacements (originally lived in the deleted product-create module). */
export interface PreviewItem {
  url: string;
  note?: string;
  source?: "vnpc" | "elabel";
}
export interface GtinOwner {
  name?: string;
  business_email?: string;
  business_phone?: string;
  full_address?: string;
  tax_code?: string;
}
export type RiskLevel = 0 | 1 | 2 | 3;

export interface AttributeDisplay {
  field_key: string;
  field_type: string;
  label_vi: string;
  value: string;
}

export type Product = {
  id: string;
  gtin: string;
  name: string;
  brand?: string | null;
  target_market?: string | null;
  product_code: string;
  product_group_id: string;
  product_group_name: string;
  status: string;
  risk_level: number;
  batch_count?: number;
  scan_count?: number;
  warning_count?: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  description: string | null;
  additional_attributes: DynamicField[];
  inter_industry_attributes: DynamicField[];
  is_current: boolean;
  root_product_id: string;
  version: number;
  business?: Record<string, unknown> | null;
  business_id: string;
  business_user_id?: string;
  images: ProductImage[];
  qr_codes: string[];
  sku: string | null;
  e_label_code: string;
  tax_code: string | null;
  country_of_origin: string | null;
  reference_price: number | null;
  is_import: boolean | null;
  is_allowed_scan: boolean;
  brick_code: string;
  brick_id: string;
  brick_name: string;
  class_code: string;
  class_id: string;
  class_name: string;
  family_code: string;
  family_id: string;
  family_name: string;
  segment_code: string;
  segment_id: string;
  segment_name: string;
  nbc_product_id: string | null;
  gtin_owner: GtinOwner | null;
  appendix_group_id: number | null;
  attributes: Record<string, unknown>;
  attributes_display?: AttributeDisplay[];
  certificate_urls: string[];
  recall_reason?: string;
  supplier?: string | null;
  supplier_info?: string | null;
};

/**
 * Manual (non–GS1) product: has SKU, no GTIN. Batch “traceability” field is a generic HTTPS detail link.
 */
export function isManualProduct(
  product: Pick<Product, "sku" | "gtin"> | null | undefined,
): boolean {
  if (!product) return false;
  const sku = product.sku?.trim() ?? "";
  return sku !== "";
}

/** GET /products query params. */
export type ProductsListSortBy =
  | "gtin"
  | "product_name"
  | "batch_count"
  | "scan_count"
  | "warning_count"
  | "created_at"
  | "updated_at";

export type ProductsListSortDir = "asc" | "desc";

export type ProductsListStatusFilter = "active" | "inactive" | "revoked";

export type ProductsListApiParams = {
  limit?: number;
  page?: number;
  q?: string;
  /** Comma-separated group UUIDs (OR). */
  product_group_id?: string;
  /** Comma-separated: active, inactive, revoked (OR). */
  status?: string;
  /** all | has_warning | no_warning */
  warning?: string;
  /** When true, `data.summary` includes aggregate counts for the filtered set. */
  summary?: boolean;
  sort_by?: ProductsListSortBy;
  sort_dir?: ProductsListSortDir;
};

/** GET /products `data.summary`. */
export type ProductsListSummary = {
  product_count: number;
  qr_code_count: number;
  active_product_count: number;
  warning_count: number;
};

/** `data` payload inside GET /products envelope. */
export type ProductsListPageData = {
  items: Product[];
  limit: number;
  page: number;
  total: number;
  total_pages: number;
  summary?: ProductsListSummary | null;
};

export type ProductsListApiResponse = ApiEnvelope<ProductsListPageData>;

const SORT_BY_VALUES: readonly ProductsListSortBy[] = [
  "gtin",
  "product_name",
  "batch_count",
  "scan_count",
  "warning_count",
  "created_at",
  "updated_at",
] as const;

function isProductsListSortBy(value: string): value is ProductsListSortBy {
  return (SORT_BY_VALUES as readonly string[]).includes(value);
}

/** Map table sort state to API params; column `id` must match `sort_by` where sortable. */
export function serverSortToProductsApiParams(
  sort: ServerSortState,
): Pick<ProductsListApiParams, "sort_by" | "sort_dir"> {
  if (!sort?.columnId || !isProductsListSortBy(sort.columnId)) {
    return { sort_by: "updated_at", sort_dir: "desc" };
  }
  return { sort_by: sort.columnId, sort_dir: sort.desc ? "desc" : "asc" };
}

/** Normalized status for badges / i18n keys. */
export const ProductStatus = {
  PUBLISHED: "published",
  DRAFT: "draft",
  RECALLED: "recalled",
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export function parseProductStatus(raw: string): ProductStatus {
  const s = raw.trim().toLowerCase();
  if (s === "active" || s === "published") return ProductStatus.PUBLISHED;
  if (s === "inactive" || s === "draft" || s === "archived")
    return ProductStatus.DRAFT;
  if (s === "recalled" || s === "withdrawn" || s === "revoked")
    return ProductStatus.RECALLED;
  return ProductStatus.DRAFT;
}

export type PagedResult<T> = {
  items: T[];
  total: number;
  summary?: ProductsListSummary | null;
};

function businessCompanyName(business: Product["business"]): string {
  if (!business || typeof business !== "object") return "";
  const name = (business as { company_name?: unknown }).company_name;
  return typeof name === "string" ? name.trim() : "";
}

/** Label for owner / enterprise link column. */
export function productOwnerDisplayName(p: Product): string {
  const fromBiz = businessCompanyName(p.business);
  if (fromBiz) return fromBiz;
  return p.business_id || p.created_by;
}

export function productOwnerId(p: Product): string {
  return p.business_id || p.created_by;
}

export type ProductByGTIN = {
  appendix_group_id: number | null;
  brand?: string | null;
  brick_code: string;
  brick_id: string;
  brick_name: string;
  certificate_urls: string[];
  class_code: string;
  class_id: string;
  class_name: string;
  country_of_origin: string | null;
  description: string;
  family_code: string;
  family_id: string;
  family_name: string;
  gtin: string;
  id: string;
  images: PreviewItem[];
  is_import: boolean;
  name: string;
  gtin_owner: GtinOwner | null;
  reference_price: number | null;
  risk_level: RiskLevel;
  segment_code: string;
  segment_id: string;
  segment_name: string;
  target_market: string;
  supplier?: string;
};

export type ProductCreateRequest = {
  name: string;
  description: string;
  gtin?: string;
  sku?: string;
  brand?: string;
  brick_code: string;
  // e_label_code: string;
  nbc_product_id: string;
  gtin_owner: GtinOwner | null;
  target_market: string;
  country_of_origin: string;
  reference_price: number;
  is_import: boolean;
  // is_allowed_scan: boolean;
  generate_qr_codes: boolean;
  certificate_urls: string[];
  images: ProductImage[];
  batches: ProductBatch[];
  attributes: Record<string, unknown>;
  additional_attributes: DynamicField[];
  inter_industry_attributes: DynamicField[];
  product_group_id: string;
  risk_level: RiskLevel;
  status: string;
  supplier: string;
  supplier_info: string;
};
export interface ProductBatch {
  batch_code: string;
  manufacturing_date?: string; // Có thể để Date nếu bạn sẽ parse format ISO
  // status: string;
  total_quantity: number;
  traceability_url?: string;
  // is_allowed_scan: boolean;
  attributes: Record<string, unknown>;
  additional_attributes: DynamicField[];
  inter_industry_attributes: DynamicField[];
}

export interface ProductImage {
  url: string;
  note: string | null;
  source: string;
}

/** Images from VNPC / GTIN lookup — read-only in gallery. */
export const PRODUCT_IMAGE_SOURCE_VNPC = "vnpc" as const;

/** Images added by admin — may be deleted via PATCH. */
export const PRODUCT_IMAGE_SOURCE_ELABEL = "elabel" as const;

export type ProductImageSource =
  | typeof PRODUCT_IMAGE_SOURCE_VNPC
  | typeof PRODUCT_IMAGE_SOURCE_ELABEL;
export interface DynamicField {
  field_code: string;
  field_value: string;
  field_name: string;
}
export type ProductCreateResponse = {
  id: string;
  name: string;
  description: string;
  gtin: string;
  sku: string;
  product_code: string;
  product_group_id: string;
  root_product_id: string;
  appendix_group_id: number;

  // Thông tin phân loại (Brick, Class, Family, Segment)
  brick_code: string;
  brick_id: string;
  brick_name: string;
  class_code: string;
  class_id: string;
  class_name: string;
  family_code: string;
  family_id: string;
  family_name: string;
  segment_code: string;
  segment_id: string;
  segment_name: string;

  e_label_code: string;
  target_market: string;
  country_of_origin: string;
  reference_price: number;
  tax_code: string;
  risk_level: number;
  version: number;

  is_import: boolean;
  is_allowed_scan: boolean;
  is_current: boolean;
  status: string;

  created_at: string; // ISO Date String
  updated_at: string;
  created_by: string;

  // Dữ liệu mở rộng
  nbc_product_id: string;
  gtin_owner: GtinOwner | null;
  attributes: Record<string, unknown>;
  additional_attributes: DynamicField[];
  inter_industry_attributes: DynamicField[];

  certificate_urls: string[];
  images: ProductImage[];
  batches: ProductBatchResponse[];

  qr_job_id: string;
  qr_bundle: unknown | null;
};
export interface ProductBatchResponse {
  id: string;
  product_id: string;
  root_batch_id: string;
  batch_code: string;
  manufacturing_date: string;
  status: string;
  total_quantity: number;
  traceability_url: string;
  tax_code: string;
  e_label_code: string;
  version: number;
  is_allowed_scan: boolean;
  is_current: boolean;
  created_at: string;
  updated_at: string;
  attributes: Record<string, unknown>;
  additional_attributes: DynamicField[];
  inter_industry_attributes: DynamicField[];
}

export const PRODUCT_FORM_DEFAULT_FIELD_MAX_LENGTH = {
  productBasicInfo: {
    productName: 255,
    sku: 50,
    gtin: 14,
    targetMarket: 255,
    brand: 255,
    country_of_origin: 255,
    supplier: 255,
    supplier_info: 255,
    description: 2000,
  },
  enterpriseOwner: {
    owner_enterprise_name: 255,
    owner_email: 100,
    owner_phone: 20,
    owner_address: 255,
  },
} as const;

/** Truncate string defaults to match {@link PRODUCT_FORM_DEFAULT_FIELD_MAX_LENGTH}. */
export function truncateProductFormField(value: unknown, maxLength: number): string {
  return String(value ?? "").slice(0, maxLength);
}
