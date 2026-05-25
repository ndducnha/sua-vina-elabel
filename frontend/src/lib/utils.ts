import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export {
  buildLotLandingPageUrl,
  getTraceabilityUrlValidation,
  isValidTraceabilityUrl,
  TXNG_TRACEABILITY_BASE_URL,
  type TraceabilityUrlHardErrorReason,
  type TraceabilityUrlValidationResult,
} from "./business/TXNG-traceability-url"
