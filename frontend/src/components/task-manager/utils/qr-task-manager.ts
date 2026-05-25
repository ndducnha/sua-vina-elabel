import type { QrBundle } from "@/models/jobs.model";
import {
  getQrTaskMode,
  QR_TASK_MODE,
  TASK_STATUS,
  type Task,
  useTaskStore,
} from "@/stores/task.store";

import { abortClientZipManager } from "./client-zip-manager-abort-registry";

export function filenameFromObjectKey(objectKey: string | undefined, fallback: string): string {
  if (!objectKey?.trim()) return fallback;
  const seg = objectKey.split("/").pop()?.trim();
  return seg || fallback;
}

/**
 * Downloads each ZIP part sequentially (blob fetch when CORS allows; otherwise opens signed URL).
 */
export async function downloadQrBundleParts(bundle: QrBundle): Promise<void> {
  const parts = bundle.parts ?? [];
  const fallbackBase = "qr-bundle.zip";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const url = part.download_url?.trim();
    if (!url) continue;

    const fallback =
      parts.length > 1 ? `qr-bundle-part-${part.part_index ?? i + 1}.zip` : fallbackBase;
    const filename = filenameFromObjectKey(part.object_key, fallback);

    try {
      const res = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      try {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.rel = "noopener";
        a.click();
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch {
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.rel = "noopener";
      a.target = "_blank";
      a.click();
    }
  }
}

/** Abort client ZIP work if any, then drop the task from global UI. */
export function disposeQrTask(taskId: string): void {
  abortClientZipManager(taskId);
  useTaskStore.getState().removeTask(taskId);
}

export function taskCanDownloadZip(task: Task): boolean {
  if (task.status === TASK_STATUS.Failed) return false;
  if (task.progress !== 100) return false;

  if (getQrTaskMode(task) === QR_TASK_MODE.ClientZipManager) {
    return !!(task.clientZip?.zipBlob && task.clientZip?.zipFilename);
  }

  return !!task.qrBundle?.parts?.length;
}

export async function executeDownloadForTask(task: Task): Promise<void> {
  if (getQrTaskMode(task) === QR_TASK_MODE.ClientZipManager) {
    const zipBlob = task.clientZip?.zipBlob;
    const zipFilename = task.clientZip?.zipFilename;
    if (!zipBlob || !zipFilename) return;

    const url = URL.createObjectURL(zipBlob);
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = zipFilename;
      a.rel = "noopener";
      a.click();
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }

  const bundle = task.qrBundle;
  if (!bundle?.parts?.length) return;

  await downloadQrBundleParts(bundle);
}
