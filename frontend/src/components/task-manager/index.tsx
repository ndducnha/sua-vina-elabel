import { TaskProgressModal } from "./components/TaskProgressModal";
import { TaskToastList } from "./components/TaskToastList";
import { useTaskManager } from "./hooks/useTaskManager";

export function TaskManager() {
  const vm = useTaskManager();

  return (
    <>
      <TaskProgressModal
        open={vm.modalOpen}
        activeTask={vm.activeTask}
        onDismissModal={vm.onModalOpenChange}
        activeCanDownloadZip={vm.activeCanDownloadZip}
        activeDownloadBusy={vm.activeDownloadBusy}
        onDownloadZip={vm.handleDownloadZip}
        onOpenCancelConfirm={vm.openCancelConfirmDialog}
        onDisposeTask={vm.disposeTask}
        onHideToToast={() => vm.setViewMode("toast")}
      />
      <TaskToastList
        visible={vm.viewMode === "toast"}
        tasks={vm.tasks}
        onDisposeTask={vm.disposeTask}
        setViewMode={vm.setViewMode}
        openCancelConfirmDialog={vm.openCancelConfirmDialog}
        handleDownloadZip={vm.handleDownloadZip}
        isDownloadBusy={vm.isDownloadBusy}
      />
    </>
  );
}

export { useTaskManager } from "./hooks/useTaskManager";
export {
  downloadQrBundleParts,
  executeDownloadForTask,
  filenameFromObjectKey,
  taskCanDownloadZip,
} from "./utils/qr-task-manager";
export { runClientZipManagerJob } from "./utils/client-zip-manager-runner";
