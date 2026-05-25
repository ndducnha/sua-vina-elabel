import axiosInstance from "@/api/interceptors/axios-instance";
import { API_ENDPOINTS } from "@/api/endpoints";
import type {
  FieldScope,
  FieldsByAppendixApiResponse,
} from "@/models/field.model";

export function fetchFieldsByAppendixGroup(params: {
  appendixGroupId?: number | null;
  product_group_id?: string;
  scope: FieldScope;
  signal?: AbortSignal;
}) {
  const query: Record<string, string | number> = { scope: params.scope };

  if (params.appendixGroupId != null && !Number.isNaN(Number(params.appendixGroupId))) {
    query.appendix_group_id = Number(params.appendixGroupId);
  }

  const productGroupId = params.product_group_id?.trim();
  if (productGroupId) {
    query.product_group_id = productGroupId;
  }

  return axiosInstance.get<FieldsByAppendixApiResponse>(API_ENDPOINTS.FIELDS.LIST, {
    params: query,
    signal: params.signal,
  });
}
