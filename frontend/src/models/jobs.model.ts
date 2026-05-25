import type { ApiEnvelope } from "@/models/api.model";

export type QrBundlePart = {
  download_url: string;
  expires_in_seconds?: number;
  file_count?: number;
  object_key?: string;
  part_index?: number;
};

export type QrBundle = {
  max_qrs_per_zip?: number;
  total_file_count?: number;
  parts?: QrBundlePart[];
};

export type JobStatus = {
  id: string;
  progress: number;
  qr_bundle?: QrBundle | null;
  status: string;
  error?: string;
};

export type QRJobsApiResponse = ApiEnvelope<JobStatus>;

