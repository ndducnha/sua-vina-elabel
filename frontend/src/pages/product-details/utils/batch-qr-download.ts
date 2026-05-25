import QRCode from "qrcode";

import { buildLotLandingPageUrl } from "@/lib/utils";
import type { ProductBatch } from "@/models/product-batch.model";

import { buildSkuBatchQrPayload } from "./product-qr";

import { parseManufacturingDateToLocalDate } from "./batch-form";

const QR_SIZE = 500;
const RE_FILENAME_UNSAFE = /[\/\?\\<>:"|*]+/g;

/** Safe filename segment: `/` and `?` (and other OS-unsafe chars) → `-`, collapse spaces. */
export function sanitizeSegmentForFilename(s: string): string {
  const t = s
    .trim()
    .replaceAll(RE_FILENAME_UNSAFE, "-")
    .replace(/\s+/g, " ")
    .replaceAll(" ", "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return t || "x";
}

/**
 * Batch/lot segment for PNG filenames: any character that is not a Unicode letter or digit → `-`
 * (each special character becomes one `-`, e.g. `!!@#` → `----`).
 */
export function sanitizeBatchCodeForFilename(batchCode: string): string {
  const t = (batchCode ?? "")
    .trim()
    .replace(/[^\p{L}\p{N}]/gu, "-")
    .replace(/^-|-$/g, "");
  return t || "x";
}

function manufacturingDateToYyyyMmDd(mfg: string | undefined | null): string {
  const d = parseManufacturingDateToLocalDate(mfg?.trim() ?? "");
  if (!d) return "00000000";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${mo}${day}`;
}

export function buildBatchQrPngFilename(primaryId: string, batch: ProductBatch): string {
  const g = sanitizeSegmentForFilename(primaryId);
  const mfg = manufacturingDateToYyyyMmDd(batch.manufacturing_date);
  const lot = sanitizeBatchCodeForFilename(batch.batch_code ?? "");
  return `${g}-${mfg}-${lot}.png`;
}

function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  const header = dataUrl.slice(0, comma);
  const base64 = dataUrl.slice(comma + 1);
  const mimeMatch = /data:(.*?);/.exec(header);
  const mime = mimeMatch?.[1] ?? "image/png";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}

type DownloadBatchQrPngOptions = {
  productGtin: string;
  productSku?: string | null;
  batch: ProductBatch;
};

function resolveBatchQrPayload({
  productGtin,
  productSku,
  batch,
}: DownloadBatchQrPngOptions): { payload: string; primaryId: string } {
  const sku = (productSku ?? "").trim();
  const gtin = productGtin?.trim();
  const primaryId = sku || gtin;
  const lot = batch.batch_code?.trim() ?? "";
  const taxCode = batch.tax_code?.trim() ?? "";
  if (!primaryId) {
    throw new Error("Missing GTIN or SKU");
  }
  if (!lot) {
    throw new Error("Missing lot / batch code");
  }
  if (!taxCode) {
    throw new Error("Missing tax code");
  }
  const payload = sku
    ? buildSkuBatchQrPayload(taxCode, sku, lot)
    : buildLotLandingPageUrl(gtin, lot, taxCode);
  return { payload, primaryId };
}

/**
 * Client-side: builds eLabel landing lot URL, renders QR (500px, ECC M),
 * triggers PNG download. Uses GS1 lot URL when GTIN is set; otherwise `{origin}/{tax}/{sku}/{lot}`.
 */
export async function downloadBatchQrPng({
  productGtin,
  productSku,
  batch,
}: DownloadBatchQrPngOptions): Promise<void> {
  const { blob, filename } = await encodeBatchQrPngBlob({ productGtin, productSku, batch });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Same payload/filename as download; returns PNG blob for ZIP packaging. */
export async function encodeBatchQrPngBlob(
  options: DownloadBatchQrPngOptions
): Promise<{ filename: string; blob: Blob }> {
  const { payload, primaryId } = resolveBatchQrPayload(options);
  const filename = buildBatchQrPngFilename(primaryId, options.batch);

  const dataUrl = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    width: QR_SIZE,
    margin: 1,
  });

  return { filename, blob: dataUrlToBlob(dataUrl) };
}
