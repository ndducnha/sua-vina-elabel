import JSZip from "jszip";

import type { ProductBatch } from "@/models/product-batch.model";
import { encodeBatchQrPngBlob, sanitizeSegmentForFilename } from "@/pages/product-details/utils/batch-qr-download";
import {
  CLIENT_ZIP_MANAGER_PHASE,
  TASK_STATUS,
  type ClientZipManagerTaskPatch,
  useTaskStore,
} from "@/stores/task.store";

import { registerClientZipManagerAbort, unregisterClientZipManagerAbort } from "./client-zip-manager-abort-registry";

function folderForQrIndex(indexZeroBased: number): string {
  const chunk = Math.floor(indexZeroBased / 1000);
  const start = chunk * 1000 + 1;
  const end = (chunk + 1) * 1000;
  return `Batch_${start}_${end}`;
}

function buildLabelsZipFilename(gtin: string): string {
  const g = sanitizeSegmentForFilename(gtin);
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `labels_${g}_${y}-${m}-${day}.zip`;
}

function taskStillPresent(taskId: string): boolean {
  return useTaskStore.getState().tasks.some((t) => t.id === taskId);
}

function safePatchClient(taskId: string, patch: ClientZipManagerTaskPatch): void {
  if (!taskStillPresent(taskId)) return;
  useTaskStore.getState().updateClientZipManagerTask(taskId, patch);
}

/**
 * Builds a ZIP of lot QR PNGs (one per selected batch) on the main thread.
 * Registers AbortController under `taskId` for cancel via `abortClientZipManager`.
 */
export async function runClientZipManagerJob(params: {
  taskId: string;
  productGtin: string;
  productSku?: string | null;
  batches: ProductBatch[];
}): Promise<void> {
  const { taskId, productGtin, productSku, batches } = params;
  const total = batches.length;

  const controller = new AbortController();
  const { signal } = controller;
  registerClientZipManagerAbort(taskId, controller);

  try {
    safePatchClient(taskId, {
      progress: 0,
      clientZip: {
        total,
        done: 0,
        phase: CLIENT_ZIP_MANAGER_PHASE.Generating,
      },
    });

    /** Single 0–100 scale: generating → packaging ZIP → complete (no per-phase reset). */
    const GENERATING_SHARE_PCT = 85;

    const zip = new JSZip();

    for (let i = 0; i < batches.length; i++) {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      const batch = batches[i]!;
      const { blob, filename } = await encodeBatchQrPngBlob({
        productGtin,
        productSku,
        batch,
      });

      const zipPath = total > 1000 ? `${folderForQrIndex(i)}/${filename}` : filename;
      zip.file(zipPath, blob);

      const genProgress =
        total > 0 ? Math.round(((i + 1) / total) * GENERATING_SHARE_PCT) : GENERATING_SHARE_PCT;
      safePatchClient(taskId, {
        progress: genProgress,
        clientZip: { done: i + 1 },
      });

      await new Promise((r) => setTimeout(r, 0));
    }

    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    const packagingStart = GENERATING_SHARE_PCT + 1;

    safePatchClient(taskId, {
      progress: packagingStart,
      clientZip: { phase: CLIENT_ZIP_MANAGER_PHASE.Packaging },
    });

    const zipFilename = buildLabelsZipFilename(
      productGtin.trim() || (productSku ?? "").trim() || "labels"
    );

    const blob = await zip.generateAsync(
      { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
      (meta) => {
        const p = typeof meta.percent === "number" ? meta.percent : 0;
        const span = 99 - packagingStart;
        const progress = Math.min(99, packagingStart + Math.round((p / 100) * span));
        safePatchClient(taskId, { progress });
      }
    );

    if (signal.aborted) {
      throw new DOMException("Aborted", "AbortError");
    }

    safePatchClient(taskId, {
      progress: 100,
      status: TASK_STATUS.Completed,
      clientZip: {
        phase: CLIENT_ZIP_MANAGER_PHASE.Complete,
        zipFilename,
        zipSizeBytes: blob.size,
        zipBlob: blob,
      },
    });
  } catch (e) {
    const aborted =
      signal.aborted ||
      (e instanceof DOMException && e.name === "AbortError") ||
      (e instanceof Error && e.name === "AbortError");
    if (aborted) {
      return;
    }
    console.error(e);
    if (taskStillPresent(taskId)) {
      useTaskStore.getState().removeTask(taskId);
    }
    throw e;
  } finally {
    unregisterClientZipManagerAbort(taskId);
  }
}
