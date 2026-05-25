import { createInitialServerListQuery, type ServerListQuery } from "@/components/dynamic-table";

export const BATCH_LIST_FILTER_KEYS = {
  /** Maps to `batch_code` query param on `GET /products/{id}/batches`. */
  batchCode: "batch_code",
  mfgFrom: "manufacturing_date_from",
  mfgTo: "manufacturing_date_to",
} as const;

const FILTER_IDS = [
  BATCH_LIST_FILTER_KEYS.batchCode,
  BATCH_LIST_FILTER_KEYS.mfgFrom,
  BATCH_LIST_FILTER_KEYS.mfgTo,
] as const;

export function createBatchListInitialQuery(): ServerListQuery {
  return { ...createInitialServerListQuery([...FILTER_IDS]), pageSize: 200 };
}
