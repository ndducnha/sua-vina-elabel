import QRCode from "qrcode";
import { getRuntimeLandingPageUrl } from "@/lib/runtime-config";

const QR_PREVIEW_SIZE = 130;
const QR_DOWNLOAD_SIZE = 500;

/**
 * Manual (SKU) product landing path: {origin}/{tax_code}/{sku}
 */
export function buildSkuProductQrPayload(sku: string, taxCode: string): string {
  const base = getRuntimeLandingPageUrl();
  const s = sku.trim();
  const t = taxCode.trim();
  const encodedTax = encodeURIComponent(t);
  const encodedSku = encodeURIComponent(s);
  return `${base}/${encodedTax}/${encodedSku}`;
}

/**
 * Manual batch landing path: {origin}/{tax_code}/{sku}/{batch_code}
 */
export function buildSkuBatchQrPayload(taxCode: string, sku: string, batchCode: string): string {
  const base = getRuntimeLandingPageUrl();
  const encodedTax = encodeURIComponent(taxCode.trim());
  const encodedSku = encodeURIComponent(sku.trim());
  const encodedLot = encodeURIComponent(batchCode.trim());
  return `${base}/${encodedTax}/${encodedSku}/${encodedLot}`;
}

function safePngBasename(segment: string): string {
  const t = segment
    .trim()
    .replace(/[/\\?<>:"|*]+/g, "-")
    .replace(/\s+/g, " ")
    .replaceAll(" ", "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t || "qr";
}

/**
 * GS1 Digital Link URL for master product (SKU level).
 * Format: {domain}/01/{GTIN}?8000={taxCode}
 *
 * RFC 3986 percent-encoding is applied to the query-string value only;
 * the path segment (GTIN) must remain unencoded per GS1 DL spec.
 */
export function buildProductQrPayload(gtin: string, taxCode: string): string {
  const domain = getRuntimeLandingPageUrl();
  const g = gtin.trim();
  const t = taxCode.trim();
  const encodedTax = encodeURIComponent(t);
  return `${domain}/01/${g}?8000=${encodedTax}`;
}

export function resolveProductQrPayload(input: {
  taxCode: string | null | undefined;
  gtin?: string | null;
  sku?: string | null;
}): string | null {
  const taxCode = input.taxCode?.trim() ?? "";
  if (!taxCode) return null;
  const sku = input.sku?.trim() ?? "";
  if (sku) return buildSkuProductQrPayload(sku, taxCode);
  const gtin = input.gtin?.trim() ?? "";
  if (gtin) return buildProductQrPayload(gtin, taxCode);
  return null;
}

/**
 * Render the QR payload as a data-URL (PNG) for the 130×130 preview.
 * Returns null if tax code is missing, or neither GTIN nor SKU is present.
 */
export async function renderProductQrPreview(input: {
  taxCode: string | null | undefined;
  gtin?: string | null;
  sku?: string | null;
}): Promise<string | null> {
  const payload = resolveProductQrPayload(input);
  if (!payload) return null;
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: QR_PREVIEW_SIZE,
    margin: 4, // ≥ 4 modules quiet zone (FR4)
  });
}

/**
 * Generate a 500×500 PNG and trigger a browser download.
 * Filename: {GTIN}.png when GTIN is set; otherwise sanitized SKU.
 */
export async function downloadProductQrPng(input: {
  taxCode: string | null | undefined;
  gtin?: string | null;
  sku?: string | null;
}): Promise<void> {
  const payload = resolveProductQrPayload(input);
  if (!payload) throw new Error("Missing tax code or product identifiers");
  const sku = input.sku?.trim() ?? "";
  const filename = sku ? `${safePngBasename(sku)}.png` : `${input.gtin?.trim() ?? ""}.png`;

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: QR_DOWNLOAD_SIZE,
    margin: 4,
  });

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.rel = "noopener";
  a.click();
}
