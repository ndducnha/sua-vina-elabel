/**
 * Envelope JSON standard: payload in `data`.
 */
export type ApiEnvelope<T> = {
  data: T;
  message?: string;
  status?: number;
  version?: string;
};
