import axiosInstance from "@/api/interceptors/axios-instance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { serializeQueryParamsWithRepeatedArrayKeys } from "@/components/dynamic-table";
import type {
  ProductGroup,
  ProductGroupsListApiResponse,
} from "@/models/product-group.model";
import type {
  ProductByGTIN,
  ProductCreateRequest,
  ProductCreateResponse,
  ProductsListApiParams,
  ProductsListApiResponse,
  Product,
  ProductStatus,
} from "@/models/product.model";
import type { ApiEnvelope } from "@/models/api.model";
// These taxonomy types lived in the now-deleted product-create module; declare
// minimal shapes for the few helpers that still reference them.
type BrickResponse = Record<string, unknown>;
type CategoryResponse = Record<string, unknown>;
type RiskFieldResponse = Record<string, unknown>;
type SegmentResponse = Record<string, unknown>;
type SubCategoryResponse = Record<string, unknown>;

export function fetchProductsList(params: ProductsListApiParams) {
  return axiosInstance.get<ProductsListApiResponse>(
    API_ENDPOINTS.PRODUCTS.LIST,
    {
      params,
      paramsSerializer: serializeQueryParamsWithRepeatedArrayKeys,
    },
  );
}

export function fetchProductById(id: string) {
  return axiosInstance.get<ApiEnvelope<Product>>(
    API_ENDPOINTS.PRODUCTS.DETAIL(id),
  );
}

export function fetchProductGroups() {
  return axiosInstance.get<ProductGroupsListApiResponse>(
    API_ENDPOINTS.PRODUCTS.GROUPS,
  );
}

export function fetchProductGroupById(id: string) {
  const trimmed = id.trim();
  return axiosInstance.get<ApiEnvelope<ProductGroup>>(
    `${API_ENDPOINTS.PRODUCTS.GROUPS}/${encodeURIComponent(trimmed)}`,
  );
}

export function fetchProductByGTIN(gtin: string) {
  return axiosInstance.get<ApiEnvelope<ProductByGTIN>>(
    `${API_ENDPOINTS.PRODUCTS.BY_GTIN}`,
    {
      params: { gtin },
    },
  );
}

/** Resolve current user's product by gtin and/or sku (GTIN tried first if both). */
export function fetchProductByCode(params: { gtin?: string; sku?: string }) {
  const q: Record<string, string> = {};
  const gtin = params.gtin?.trim();
  const sku = params.sku?.trim();
  if (gtin) q.gtin = gtin;
  if (sku) q.sku = sku;
  return axiosInstance.get<ApiEnvelope<Product>>(API_ENDPOINTS.PRODUCTS.BY_CODE, {
    params: q,
    skipGlobalErrorToast: true,
  });
}

export function fetchListOfSegment() {
  const url = API_ENDPOINTS.CLASSIFICATION.SEGMENT;
  return axiosInstance.get<ApiEnvelope<SegmentResponse[]>>(url);
}

export function fetchCategoryBySegment(segmentCode: string) {
  const url = API_ENDPOINTS.CLASSIFICATION.CATEGORY;
  return axiosInstance.get<ApiEnvelope<CategoryResponse[]>>(url, {
    params: { segment_code: segmentCode },
  });
}

export function fetchSubCategoryByCater(categoryCode: string) {
  const url = API_ENDPOINTS.CLASSIFICATION.SUB_CATERGORY;
  return axiosInstance.get<ApiEnvelope<SubCategoryResponse[]>>(url, {
    params: { family_code: categoryCode },
  });
}

export function fetchBrickBySubCater(subCategoryCode: string) {
  const url = API_ENDPOINTS.CLASSIFICATION.BRICK;
  return axiosInstance.get<ApiEnvelope<BrickResponse[]>>(url, {
    params: { class_code: subCategoryCode },
  });
}

export function fetchRiskFieldBlock(brickCode: string, scope: string) {
  const url = API_ENDPOINTS.CLASSIFICATION.RISK_FIELDS;
  return axiosInstance.get<ApiEnvelope<RiskFieldResponse[]>>(url, {
    params: { brick_code: brickCode, scope },
  });
}

export function createProduct(data: ProductCreateRequest) {
  const url = API_ENDPOINTS.PRODUCTS.LIST;
  return axiosInstance.post<ApiEnvelope<ProductCreateResponse>>(url, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
export function updateProduct({ productId, data }: { productId: string; data: Partial<Product> }) {
  const url = API_ENDPOINTS.PRODUCTS.DETAIL(productId);
  return axiosInstance.patch<ApiEnvelope<Product>>(url, data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export function updateProductStatus({ productId, status, reason }: { productId: string; status: ProductStatus; reason?: string }) {
  const url = API_ENDPOINTS.PRODUCTS.STATUS(productId);
  return axiosInstance.patch<ApiEnvelope<Product>>(url, { status, recall_reason: reason }, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

/** `DELETE /api/products/{id}` */
export function deleteProduct(productId: string) {
  const id = productId.trim();
  return axiosInstance.delete<ApiEnvelope<{ deleted: boolean }>>(API_ENDPOINTS.PRODUCTS.DETAIL(id), {
    skipGlobalErrorToast: true,
  });
}