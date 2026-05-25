/** AbortControllers for in-flight client-side ZIP jobs (task-manager only). */

const abortByTaskId = new Map<string, AbortController>();

export function registerClientZipManagerAbort(taskId: string, controller: AbortController): void {
  abortByTaskId.set(taskId, controller);
}

export function unregisterClientZipManagerAbort(taskId: string): void {
  abortByTaskId.delete(taskId);
}

export function abortClientZipManager(taskId: string): void {
  abortByTaskId.get(taskId)?.abort();
  abortByTaskId.delete(taskId);
}
