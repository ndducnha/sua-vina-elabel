import { fetchQRJobs } from "@/api/jobs";
import { registerAccountCacheCleanup } from "@/lib/auth-logout";
import type { QrBundle } from "@/models/jobs.model";
import { create } from "zustand";

/** How the QR packaging task is executed */
export const QR_TASK_MODE = {
  ServerJob: "server_job",
  ClientZipManager: "client_zip_manager",
} as const;

export type QrTaskMode = (typeof QR_TASK_MODE)[keyof typeof QR_TASK_MODE];

export const CLIENT_ZIP_MANAGER_PHASE = {
  Generating: "generating",
  Packaging: "packaging",
  Complete: "complete",
} as const;

export type ClientZipManagerPhase =
  (typeof CLIENT_ZIP_MANAGER_PHASE)[keyof typeof CLIENT_ZIP_MANAGER_PHASE];

export const TASK_STATUS = {
  Processing: "processing",
  Completed: "completed",
  Failed: "failed",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

/** Client-side ZIP build progress + artifact (only when `QR_TASK_MODE.ClientZipManager`) */
export interface ClientZipTaskState {
  phase: ClientZipManagerPhase;
  done: number;
  total: number;
  zipFilename?: string;
  zipSizeBytes?: number;
  zipBlob?: Blob;
}

export interface Task {
  id: string;
  name: string;
  jobId?: string;
  progress: number;
  status: TaskStatus;
  qrBundle?: QrBundle | null;
  /** Server job failure message when `status === failed` */
  errorMessage?: string;
  /** Set for on-device ZIP jobs; omit for server QR job polling */
  clientZip?: ClientZipTaskState;
  onDisposeAfterSuccess?: () => void;
}

export type ClientZipManagerTaskPatch = Partial<Pick<Task, "progress" | "status">> & {
  clientZip?: Partial<ClientZipTaskState>;
};

export type AddTaskOptions = {
  mode?: QrTaskMode;
  clientTotal?: number;
  onDisposeAfterSuccess?: () => void;
};

interface TaskState {
  tasks: Task[];
  activeTaskId: string | null;
  viewMode: "modal" | "toast" | "hidden";

  addTask: (id: string, name: string, opts?: AddTaskOptions) => void;
  updateProgress: (id: string, p: number) => void;
  markTaskFailed: (id: string, progress: number, errorMessage: string) => void;
  updateClientZipManagerTask: (id: string, patch: ClientZipManagerTaskPatch) => void;
  setViewMode: (mode: "modal" | "toast" | "hidden", id?: string) => void;
  removeTask: (id: string) => void;
  startPolling: (jobId: string, taskId: string) => void;
  clearAllTasks: () => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  tasks: [],
  activeTaskId: null,
  viewMode: "hidden",

  addTask: (id, name, opts) =>
    set((state) => {
      const base =
        opts?.mode === QR_TASK_MODE.ClientZipManager
          ? {
              id,
              name,
              progress: 0,
              status: TASK_STATUS.Processing,
              clientZip: {
                phase: CLIENT_ZIP_MANAGER_PHASE.Generating,
                done: 0,
                total: opts.clientTotal ?? 0,
              },
            }
          : { id, name, progress: 0, status: TASK_STATUS.Processing };
      const task: Task = opts?.onDisposeAfterSuccess
        ? { ...base, onDisposeAfterSuccess: opts.onDisposeAfterSuccess }
        : base;
      return {
        tasks: [...state.tasks, task],
        activeTaskId: id,
        viewMode: "modal",
      };
    }),

  updateProgress: (id, p) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              progress: p,
              status:
                t.status === TASK_STATUS.Failed
                  ? TASK_STATUS.Failed
                  : p >= 100
                    ? TASK_STATUS.Completed
                    : TASK_STATUS.Processing,
            }
          : t
      ),
    })),

  markTaskFailed: (id, progress, errorMessage) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              progress,
              status: TASK_STATUS.Failed,
              errorMessage: errorMessage.trim() || undefined,
            }
          : t
      ),
    })),

  updateClientZipManagerTask: (id, patch) =>
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t;
        let next: Task = { ...t };
        if (patch.progress !== undefined) next = { ...next, progress: patch.progress };
        if (patch.status !== undefined) next = { ...next, status: patch.status };
        if (patch.clientZip !== undefined && next.clientZip) {
          next = {
            ...next,
            clientZip: { ...next.clientZip, ...patch.clientZip },
          };
        }
        return next;
      }),
    })),

  startPolling: async (jobId: string, taskId: string) => {
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === taskId ? { ...task, jobId } : task)),
    }));

    const poll = async () => {
      try {
        const taskExists = get().tasks.some((task) => task.id === taskId);
        if (!taskExists) {
          return;
        }

        const res = await fetchQRJobs({ jobId });
        const raw = res.data.data;
        const progress = typeof raw.progress === "number" ? raw.progress : 0;
        const status = raw.status ?? "";
        const error = raw.error;
        const qr_bundle = raw.qr_bundle;

        const statusNorm = String(status).trim().toLowerCase();
        const terminalFail = !!error || statusNorm === "failed";

        if (terminalFail) {
          const msg = typeof error === "string" ? error.trim() : "";
          get().markTaskFailed(taskId, progress, msg);
          return;
        }

        const terminalOk =
          progress >= 100 || status === "completed" || status === "done";

        if (terminalOk && Array.isArray(qr_bundle?.parts) && qr_bundle.parts.length > 0) {
          set((state) => ({
            tasks: state.tasks.map((t) =>
              t.id === taskId
                ? {
                    ...t,
                    progress: 100,
                    status: TASK_STATUS.Completed,
                    qrBundle: qr_bundle,
                  }
                : t
            ),
          }));
          return;
        }

        if (terminalOk) {
          get().updateProgress(taskId, 100);
          return;
        }

        get().updateProgress(taskId, progress);
        setTimeout(poll, 200);
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    poll();
  },

  setViewMode: (mode, id) =>
    set((state) => ({
      viewMode: mode,
      activeTaskId: id || state.activeTaskId,
    })),

  removeTask: (id) =>
    set((state) => {
      const newTasks = state.tasks.filter((t) => t.id !== id);
      return {
        tasks: newTasks,
        viewMode: newTasks.length === 0 ? "hidden" : state.viewMode,
        activeTaskId: state.activeTaskId === id ? newTasks[0]?.id || null : state.activeTaskId,
      };
    }),

  clearAllTasks: () =>
    set({
      tasks: [],
      activeTaskId: null,
      viewMode: "hidden",
    }),
}));

registerAccountCacheCleanup(() => {
  useTaskStore.getState().clearAllTasks();
});

export function getQrTaskMode(task: Task): QrTaskMode {
  return task.clientZip ? QR_TASK_MODE.ClientZipManager : QR_TASK_MODE.ServerJob;
}
