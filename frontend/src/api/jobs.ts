import { API_ENDPOINTS } from "@/api/endpoints";
import axiosInstance from "@/api/interceptors/axios-instance";
import type { QRJobsApiResponse } from "@/models/jobs.model";

export function fetchQRJobs(params: {
  jobId: string;
}) {
  return axiosInstance.get<QRJobsApiResponse>(
    API_ENDPOINTS.QR_JOBS.STATUS(params.jobId)
  );
}

export function cancelQRJob(params: {
  jobId: string;
}) {
  return axiosInstance.delete(API_ENDPOINTS.QR_JOBS.STATUS(params.jobId));
}
