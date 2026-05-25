import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import { TaskProgress } from "./TaskProgress";
import { TASK_STATUS, type Task } from "@/stores/task.store";

export type ServerTaskManagerProps = {
  activeTask: Task | undefined;
  activeCanDownloadZip: boolean;
  activeDownloadBusy: boolean;
  onDownloadZip: (task: Task) => void | Promise<void>;
  onOpenCancelConfirm: (taskId: string, jobId?: string) => void;
  onRemoveTask: (taskId: string) => void;
  onHideToToast: () => void;
};

/** Step 4 + bulk server QR job: polling + signed ZIP URL. */
export function ServerTaskManager({
  activeTask,
  activeCanDownloadZip,
  activeDownloadBusy,
  onDownloadZip,
  onRemoveTask,
  onHideToToast,
}: ServerTaskManagerProps) {
  const { t } = useTranslation();

  const isFailed = activeTask?.status === TASK_STATUS.Failed;
  const isComplete = activeTask?.progress === 100 && activeTask.status === TASK_STATUS.Completed;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left text-xl font-bold">
          {isFailed
            ? t("productCreate.step4.createQrFailedTitle")
            : isComplete
              ? t("productCreate.step4.taskManager.completed")
              : t("productCreate.step4.taskManager.creatingQrTitle")}
        </DialogTitle>
      </DialogHeader>
      {isFailed ? (
        <div className="flex flex-col items-center gap-4 py-2">
          <div className="flex size-20 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-10" aria-hidden />
          </div>
          <p className="text-muted-foreground max-w-md px-2 text-center text-sm">
            {t("productCreate.step4.taskManager.failedDescription")}
          </p>
          <p
            className="text-destructive border-destructive/30 bg-destructive/5 wrap-break-word max-h-40 w-full overflow-y-auto rounded-md border px-4 py-3 text-center text-sm"
            role="alert"
          >
            {activeTask?.errorMessage?.trim() || t("common.error")}
          </p>
        </div>
      ) : activeTask?.progress != 0 ? (
        <TaskProgress
          variant="arc"
          percent={activeTask?.progress}
          label={
            isComplete
              ? t("productCreate.step4.taskManager.completed")
              : t("productCreate.step4.taskManager.creatingQrShort")
          }
        />
      ) : (
        <div className="flex items-center justify-center">
          <Spinner className="size-14" />
        </div>
      )}
      <div className="flex flex-col items-center space-y-6">
        <div className="">
          {isFailed ? null : isComplete ? (
            <p className="px-4">{t("productCreate.step4.taskManager.completedMessage")}</p>
          ) : (
            <p className="px-4">
              {t("productCreate.step4.taskManager.processingMessage")}
              <br />
              {t("productCreate.step4.taskManager.pleaseWait")}
            </p>
          )}
        </div>
      </div>
      <div className="flex flex-wrap justify-end gap-2 w-full pt-2">
        <Button
          variant="outline"
          size="lg"
          onClick={() => {
            if (!activeTask) return;
            if (isComplete || isFailed) {
              onRemoveTask(activeTask.id);
              return;
            }
            // onOpenCancelConfirm(activeTask.id, activeTask.jobId);
          }}
        >
          {/* {isComplete || isFailed
            ? t("productCreate.step4.taskManager.close")
            : t("productCreate.step4.taskManager.cancelCreation")} */}
            {t("productCreate.step4.taskManager.close")}
        </Button>
        {activeCanDownloadZip ? (
          <Button
            size="lg"
            disabled={activeDownloadBusy}
            onClick={() => activeTask && void onDownloadZip(activeTask)}
          >
            {activeDownloadBusy ? (
              <Loader2 className="size-4 animate-spin mr-2" aria-hidden />
            ) : null}
            {t("productCreate.step4.taskManager.downloadZip")}
          </Button>
        ) : null}

        {!isFailed && !isComplete && (
          <Button size="lg" onClick={onHideToToast}>
            {t("productCreate.step4.taskManager.hideAndContinue")}
          </Button>
        )}
      </div>
    </>
  );
}
