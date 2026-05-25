import { useCallback, useMemo, useReducer, useRef } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

import { cancelQRJob } from "@/api/jobs";
import { messageDialogService } from "@/components/dialog/messageDialog";
import { abortClientZipManager } from "../utils/client-zip-manager-abort-registry";
import {
  disposeQrTask as disposeQrTaskUtil,
  executeDownloadForTask,
  taskCanDownloadZip,
} from "../utils/qr-task-manager";
import {
  getQrTaskMode,
  QR_TASK_MODE,
  TASK_STATUS,
  type Task,
  useTaskStore,
} from "@/stores/task.store";

export function useTaskManager() {
  const { t } = useTranslation();
  const removeTaskFromStore = useTaskStore((s) => s.removeTask);
  const { tasks, activeTaskId, viewMode, setViewMode } = useTaskStore();

  const activeTask = useMemo(
    () => tasks.find((tk) => tk.id === activeTaskId),
    [tasks, activeTaskId]
  );

  const busyDownloadsRef = useRef(new Set<string>());
  const [, rerenderForDownloadBusy] = useReducer((n: number) => n + 1, 0);

  const isDownloadBusy = useCallback((taskId: string) => busyDownloadsRef.current.has(taskId), []);

  const handleCancelTask = useCallback(
    async (taskId: string, jobId?: string) => {
      const task = useTaskStore.getState().tasks.find((tk) => tk.id === taskId);
      if (!task) {
        removeTaskFromStore(taskId);
        return;
      }

      const mode = getQrTaskMode(task);

      if (mode === QR_TASK_MODE.ClientZipManager) {
        abortClientZipManager(taskId);
        removeTaskFromStore(taskId);
        toast.info(t("productCreate.zipManager.cancelledToast"));
        return;
      }

      try {
        if (jobId) {
          await cancelQRJob({ jobId });
        }
        removeTaskFromStore(taskId);
      } catch (e) {
        console.error(e);
        toast.error(t("common.error"));
      }
    },
    [removeTaskFromStore, t]
  );

  const disposeTask = useCallback(
    (taskId: string) => {
      const task = useTaskStore.getState().tasks.find((tk) => tk.id === taskId);
      if (
        task &&
        getQrTaskMode(task) === QR_TASK_MODE.ServerJob &&
        task.status === TASK_STATUS.Processing
      ) {
        void handleCancelTask(taskId, task.jobId);
        return;
      }
      if (task?.status === TASK_STATUS.Completed && task.onDisposeAfterSuccess) {
        task.onDisposeAfterSuccess();
      }
      disposeQrTaskUtil(taskId);
    },
    [handleCancelTask]
  );

  const handleDownloadZip = useCallback(
    async (task: Task) => {
      if (busyDownloadsRef.current.has(task.id)) return;

      const isClient = getQrTaskMode(task) === QR_TASK_MODE.ClientZipManager;
      if (isClient && (!task.clientZip?.zipBlob || !task.clientZip?.zipFilename)) {
        return;
      }
      const bundle = task.qrBundle;
      if (!isClient && !bundle?.parts?.length) return;

      busyDownloadsRef.current.add(task.id);
      rerenderForDownloadBusy();

      try {
        await executeDownloadForTask(task);
        toast.success(t("productCreate.step4.taskManager.downloadZipSuccess"));
      } catch (e) {
        console.error(e);
        toast.error(t("productCreate.step4.taskManager.downloadZipError"));
      } finally {
        busyDownloadsRef.current.delete(task.id);
        rerenderForDownloadBusy();
      }
    },
    [t]
  );

  const openCancelConfirmDialog = useCallback(
    (taskId: string, jobId?: string) => {
      const taskSnapshot = useTaskStore.getState().tasks.find((tk) => tk.id === taskId);
      if (taskSnapshot?.status === TASK_STATUS.Failed) {
        disposeTask(taskId);
        return;
      }
      messageDialogService.open({
        context: "warning",
        title: t("productCreate.step4.taskManager.cancelConfirmTitle"),
        message: t("productCreate.step4.taskManager.cancelConfirmMessage"),
        cancelText: t("common.cancel"),
        confirmButton: {
          text: t("productCreate.step4.taskManager.cancelConfirmButton"),
          onSubmit: async () => {
            try {
              await handleCancelTask(taskId, jobId);
            } finally {
              messageDialogService.close();
            }
          },
        },
      });
    },
    [handleCancelTask, t, disposeTask]
  );

  const activeCanDownloadZip = activeTask ? taskCanDownloadZip(activeTask) : false;

  const activeDownloadBusy = activeTask ? isDownloadBusy(activeTask.id) : false;

  const modalOpen = viewMode === "modal" && !!activeTask;

  const onModalOpenChange = useCallback(() => {
    setViewMode("toast");
  }, [setViewMode]);

  return {
    modalOpen,
    activeTask,
    tasks,
    viewMode,
    setViewMode,
    disposeTask,
    activeCanDownloadZip,
    activeDownloadBusy,
    handleDownloadZip,
    openCancelConfirmDialog,
    isDownloadBusy,
    onModalOpenChange,
  };
}
