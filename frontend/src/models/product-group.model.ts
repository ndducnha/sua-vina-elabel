import type { ApiEnvelope } from "@/models/api.model";

export type ProductGroup = {
  appendix_group_id: number | null;
  id: string;
  code: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
};

export type ProductGroupsListApiResponse = ApiEnvelope<ProductGroup[]>;
