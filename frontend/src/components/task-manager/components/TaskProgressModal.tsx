import { Dialog, DialogContent } from "@/components/ui/dialog";

import { ClientTaskManager } from "./ClientTaskManager";
import { ServerTaskManager } from "./ServerTaskManager";
import type { Task } from "@/stores/task.store";
import { getQrTaskMode, QR_TASK_MODE } from "@/stores/task.store";

type TaskProgressModalProps = {
  open: boolean;
  activeTask: Task | undefined;
  onDismissModal: () => void;
  activeCanDownloadZip: boolean;
  activeDownloadBusy: boolean;
  onDownloadZip: (task: Task) => void | Promise<void>;
  onOpenCancelConfirm: (taskId: string, jobId?: string) => void;
  /** Remove from UI; server job failed triggers cancel-job API inside handler */
  onDisposeTask: (taskId: string) => void;
  onHideToToast: () => void;
};

export function TaskProgressModal({
  open,
  activeTask,
  onDismissModal,
  activeCanDownloadZip,
  activeDownloadBusy,
  onDownloadZip,
  onOpenCancelConfirm,
  onDisposeTask,
  onHideToToast,
}: TaskProgressModalProps) {
  const mode = activeTask ? getQrTaskMode(activeTask) : QR_TASK_MODE.ServerJob;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onDismissModal();
      }}
    >
      <DialogContent className="sm:max-w-2xl text-center p-8">
        {mode === QR_TASK_MODE.ClientZipManager ? (
          <ClientTaskManager
            activeTask={activeTask}
            activeCanDownloadZip={activeCanDownloadZip}
            activeDownloadBusy={activeDownloadBusy}
            onDownloadZip={onDownloadZip}
            onOpenCancelConfirm={onOpenCancelConfirm}
            onRemoveTask={onDisposeTask}
            onHideToToast={onHideToToast}
          />
        ) : (
          <ServerTaskManager
            activeTask={activeTask}
            activeCanDownloadZip={activeCanDownloadZip}
            activeDownloadBusy={activeDownloadBusy}
            onDownloadZip={onDownloadZip}
            onOpenCancelConfirm={onOpenCancelConfirm}
            onRemoveTask={onDisposeTask}
            onHideToToast={onHideToToast}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
