import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Spinner } from "@/components/ui/spinner";
import { TaskProgress } from "./TaskProgress";
import {
  CLIENT_ZIP_MANAGER_PHASE,
  TASK_STATUS,
  type Task,
} from "@/stores/task.store";

export type ClientTaskManagerProps = {
  activeTask: Task | undefined;
  activeCanDownloadZip: boolean;
  activeDownloadBusy: boolean;
  onDownloadZip: (task: Task) => void | Promise<void>;
  onOpenCancelConfirm: (taskId: string, jobId?: string) => void;
  onRemoveTask: (taskId: string) => void;
  onHideToToast: () => void;
};

/** Browser-side bulk ZIP (product details, ≤ batch threshold). */
export function ClientTaskManager({
  activeTask,
  activeCanDownloadZip,
  activeDownloadBusy,
  onDownloadZip,
  onRemoveTask,
  onHideToToast,
}: ClientTaskManagerProps) {
  const { t } = useTranslation();

  const done = activeTask?.clientZip?.done ?? 0;
  const total = activeTask?.clientZip?.total ?? 0;
  const complete =
    activeTask?.progress === 100 && activeTask?.status === TASK_STATUS.Completed;

  const phaseKey =
    activeTask?.clientZip?.phase === CLIENT_ZIP_MANAGER_PHASE.Packaging
      ? "productCreate.zipManager.phasePackaging"
      : activeTask?.clientZip?.phase === CLIENT_ZIP_MANAGER_PHASE.Complete
        ? "productCreate.zipManager.phaseComplete"
        : "productCreate.zipManager.phaseGenerating";

  const progressLabel = complete
    ? t("productCreate.step4.taskManager.completed")
    : t(phaseKey);

  const dialogTitle = complete
    ? t("productCreate.step4.taskManager.completed")
    : t("productCreate.step4.taskManager.creatingQrTitle");

  const arcPercent = complete ? 100 : (activeTask?.progress ?? 0);

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-left text-xl font-bold">{dialogTitle}</DialogTitle>
      </DialogHeader>

      {!activeTask ? (
        <div className="flex items-center justify-center py-8">
          <Spinner className="size-14" />
        </div>
      ) : (
        <TaskProgress variant="arc" percent={arcPercent} label={progressLabel} />
      )}

      <div className="flex flex-col items-center space-y-6">
        <div className="">
          {complete ? (
            <p className="px-4">
              {t("productCreate.zipManager.completeMessage", { count: total })}
            </p>
          ) : (
            <p className="px-4 text-sm text-muted-foreground w-full">
              {t("productCreate.zipManager.subtitleCount", { done, total })}
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
            if (complete) {
              onRemoveTask(activeTask.id);
              return;
            }
            // onOpenCancelConfirm(activeTask.id, activeTask.jobId);
          }}
        >
          {t("productCreate.step4.taskManager.close")}
          {/* {complete
            ? t("productCreate.step4.taskManager.close")
            : t("productCreate.step4.taskManager.cancelCreation")} */}
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

        {!complete && (
          <Button size="lg" onClick={onHideToToast}>
            {t("productCreate.step4.taskManager.hideAndContinue")}
          </Button>
        )}
      </div>
    </>
  );
}
