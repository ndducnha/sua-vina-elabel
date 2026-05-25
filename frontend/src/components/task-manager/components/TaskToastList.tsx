import { Button } from "@/components/ui/button";
import { AlertCircle, FileArchive, Loader2, Maximize2, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";

import { TaskProgress } from "./TaskProgress";
import { getQrTaskMode, QR_TASK_MODE, TASK_STATUS, type Task } from "@/stores/task.store";

type TaskToastListProps = {
  visible: boolean;
  tasks: Task[];
  onDisposeTask: (taskId: string) => void;
  setViewMode: (mode: "modal" | "toast" | "hidden", taskId?: string) => void;
  openCancelConfirmDialog: (taskId: string, jobId?: string) => void;
  handleDownloadZip: (task: Task) => void | Promise<void>;
  isDownloadBusy: (taskId: string) => boolean;
};

export function TaskToastList({
  visible,
  tasks,
  onDisposeTask,
  setViewMode,
  openCancelConfirmDialog,
  handleDownloadZip,
  isDownloadBusy,
}: TaskToastListProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-16 right-6 z-100 flex flex-col-reverse gap-3 pointer-events-none">
      <AnimatePresence>
        {visible &&
          tasks.map((task) => {
            const toastCanDownload =
              task.status !== TASK_STATUS.Failed &&
              task.progress === 100 &&
              (getQrTaskMode(task) === QR_TASK_MODE.ClientZipManager
                ? !!(task.clientZip?.zipBlob && task.clientZip?.zipFilename)
                : !!task.qrBundle?.parts?.length);
            const toastBusy = isDownloadBusy(task.id);

            const isFailed = task.status === TASK_STATUS.Failed;
            const isProcessing = task.status === TASK_STATUS.Processing;

            return (
              <motion.div
                key={task.id}
                layout
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 100, opacity: 0 }}
                className="pointer-events-auto w-80 bg-[#F7F8FC] dark:bg-slate-950 shadow-2xl border rounded-xl p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0">
                    {isProcessing ? (
                      <div className="relative flex flex-col items-center justify-center">
                        <TaskProgress variant="circle" percent={task.progress} />
                        <p className="text-xs text-muted-foreground">
                          {t("productCreate.step4.taskManager.creatingQrShort")}
                        </p>
                      </div>
                    ) : isFailed ? (
                      <div className="relative flex flex-col items-center justify-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                          <AlertCircle className="size-8" aria-hidden />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-green-100 p-2 rounded-full text-green-600">
                        <FileArchive className="h-14 w-14" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-hidden flex flex-col gap-3">
                    <div>
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold truncate pr-2">
                          {isProcessing
                            ? t("productCreate.step4.taskManager.creatingQrProgress", {
                                progress: task.progress,
                              })
                            : isFailed
                              ? t("productCreate.step4.createQrFailedTitle")
                              : t("productCreate.step4.taskManager.creationCompleted")}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onDisposeTask(task.id)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p
                        className={
                          isFailed
                            ? "text-destructive text-xs line-clamp-3"
                            : "text-xs text-muted-foreground line-clamp-3"
                        }
                      >
                        {isProcessing
                          ? t("productCreate.step4.taskManager.pleaseWait")
                          : isFailed
                            ? task.errorMessage?.trim() || t("common.error")
                            : t("productCreate.step4.taskManager.fileReady")}
                      </p>
                    </div>

                    {isProcessing ? (
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setViewMode("modal", task.id)}
                          className="text-sm text-blue-600 font-medium flex items-center cursor-pointer hover:text-blue-800 "
                        >
                          <Maximize2 className="h-3 w-3 mr-1" />{" "}
                          {t("productCreate.step4.taskManager.viewDetails")}
                        </button>
                        <button
                          type="button"
                          onClick={() => openCancelConfirmDialog(task.id, task.jobId)}
                          className="text-sm font-medium flex items-center cursor-pointer hover:text-red-600"
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    ) : isFailed ? (
                      <div className="flex justify-between">
                        <button
                          type="button"
                          onClick={() => setViewMode("modal", task.id)}
                          className="text-sm text-blue-600 font-medium flex items-center cursor-pointer hover:text-blue-800 "
                        >
                          <Maximize2 className="h-3 w-3 mr-1" />{" "}
                          {t("productCreate.step4.taskManager.viewDetails")}
                        </button>
                        <button
                          type="button"
                          onClick={() => onDisposeTask(task.id)}
                          className="text-sm font-medium flex items-center cursor-pointer hover:text-red-600"
                        >
                          {t("productCreate.step4.taskManager.close")}
                        </button>
                      </div>
                    ) : toastCanDownload ? (
                      <div className="flex justify-end">
                        <Button
                          variant="link"
                          className="h-auto p-0 text-sm text-blue-600 justify-start gap-1"
                          disabled={toastBusy}
                          onClick={() => void handleDownloadZip(task)}
                        >
                          {toastBusy ? (
                            <Loader2 className="size-3.5 animate-spin shrink-0" aria-hidden />
                          ) : null}
                          {t("productCreate.step4.taskManager.downloadZip")}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            );
          })}
      </AnimatePresence>
    </div>
  );
}
