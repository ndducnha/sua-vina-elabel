import { getRuntimeLandingPageUrl } from "@/lib/runtime-config"

const TXNG_TRACEABILITY_HOST = "qr.txng.gov.vn"
const GS1_GTIN_LOT_IN_PATH = /\/01\/([^/]+)\/10\/([^/?#]+)/i

/** eLabel landing origin for QR payloads; Docker `LANDING_PAGE_URL` or `VITE_ELABEL_LANDING_BASE_URL`. */
export const TXNG_TRACEABILITY_BASE_URL = getRuntimeLandingPageUrl()

/**
 * eLabel landing URL encoded in QR: `/01/{GTIN}/{batch_code}`.
 * `batch_code` is `encodeURIComponent`'d; GTIN is a literal path segment (typically digits only).
 */
export function buildLotLandingPageUrl(gtin: string, lotNumber: string, taxCode: string): string {
  const base = TXNG_TRACEABILITY_BASE_URL
  const g = (gtin ?? "").trim()
  const lot = lotNumber ?? ""
  if (!g || !lot.trim()) {
    return `${base}/01/undefined/10/undefined?8000=${taxCode}`
  }
  return `${base}/01/${g}/10/${encodeURIComponent(lot)}?8000=${taxCode}`
}

export type TraceabilityUrlHardErrorReason = "parse" | "domain" | "path" | "gtin"

/**
 * Phased result for national TXNG traceability URLs.
 * - `empty`: no value (valid for optional field).
 * - `error` / hard reasons: must block save with inline error.
 * - `lot_warning`: URL structure matches but {lot} segment !== batch lot (soft; save still allowed).
 * - `ok`: full match when non-empty.
 */
export type TraceabilityUrlValidationResult =
  | { result: "empty" }
  | { result: "error"; reason: TraceabilityUrlHardErrorReason }
  | { result: "lot_warning" }
  | { result: "ok" }

/**
 * Classify a traceability URL for UI + schema. Host must be `qr.txng.gov.vn`,
 * path must match `/01/{GTIN}/10/{lot}`. `lotCode` is the current batch/series in the form.
 */
export function getTraceabilityUrlValidation(
  raw: string | null | undefined,
  productGtin: string | null | undefined,
  lotCode: string | null | undefined
): TraceabilityUrlValidationResult {
  const trimmed = (raw ?? "").trim()
  if (trimmed === "") {
    return { result: "empty" }
  }

  const g = (productGtin ?? "").trim()
  if (!g) {
    return { result: "error", reason: "gtin" }
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    try {
      const normalized = trimmed.includes("://")
        ? trimmed
        : `https://${trimmed.replace(/^\/+/, "")}`
      url = new URL(normalized)
    } catch {
      return { result: "error", reason: "parse" }
    }
  }

  if (url.hostname.toLowerCase() !== TXNG_TRACEABILITY_HOST) {
    return { result: "error", reason: "domain" }
  }

  const m = url.pathname.match(GS1_GTIN_LOT_IN_PATH)
  if (!m) {
    return { result: "error", reason: "path" }
  }

  const gtinInUrl = m[1].trim()
  const lotInUrl = m[2].trim()

  if (gtinInUrl !== g) {
    return { result: "error", reason: "gtin" }
  }

  const lot = (lotCode ?? "").trim()
  if (lot !== "" && lotInUrl !== lot) {
    return { result: "lot_warning" }
  }

  return { result: "ok" }
}

/**
 * National TXNG traceability URL: host `qr.txng.gov.vn`, path `/01/{GTIN}/10/{lot}`.
 * Empty `raw` is valid (optional). Lot mismatch in URL vs batch is allowed (soft warning only in UI).
 */
export function isValidTraceabilityUrl(
  raw: string | null | undefined,
  productGtin: string | null | undefined,
  lotCode: string | null | undefined
): boolean {
  const v = getTraceabilityUrlValidation(raw, productGtin, lotCode)
  return v.result === "empty" || v.result === "ok" || v.result === "lot_warning"
}
