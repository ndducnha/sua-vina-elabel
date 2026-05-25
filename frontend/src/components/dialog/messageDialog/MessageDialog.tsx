import { useState } from "react";
import { useShallow } from "zustand/shallow";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useMessageDialogStore } from "./messageDialogService";
import type { MessageDialogContentConfig, MessageDialogContext } from "./index";

type MessageDialogViewProps = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  content: MessageDialogContentConfig;
};

function MessageDialogView({ isOpen, onOpenChange, content }: MessageDialogViewProps) {
  const { context, title, message, cancelText, confirmButton } = content;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const confirmEnabled = confirmButton.enable !== false;
  const dialogContext: MessageDialogContext = context;
  const isBusy = isSubmitting;

  const handleConfirm = async () => {
    if (!confirmEnabled || isBusy) return;
    setIsSubmitting(true);
    try {
      await confirmButton.onSubmit();
    } catch {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md gap-0 p-0 shadow-lg sm:max-w-md"
        showCloseButton={!isBusy}
      >
        <div className="px-4 pt-4 pb-2">
          <DialogHeader className="space-y-2 text-left sm:text-left">
            <DialogTitle className={cn("pr-8 text-left text-base font-semibold leading-snug text-foreground", dialogContext === "error" && "text-[#D32F2F]")}>
              {title}
            </DialogTitle>
            <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
              {message}
            </DialogDescription>
          </DialogHeader>
        </div>
        <DialogFooter className="mx-0! mb-0! mt-0 flex w-full flex-row items-center justify-end gap-2 rounded-b-xl border-t border-border bg-background px-4 py-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="min-w-18 rounded-lg border border-border bg-background"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={!confirmEnabled || isBusy}
            className={cn(
              "min-w-18 rounded-lg text-primary-foreground focus-visible:ring-3",
              dialogContext === "warning"
                ? "bg-[#D32F2F] hover:bg-red-700 focus-visible:ring-red-500/50"
                : "bg-primary hover:bg-primary/90 focus-visible:ring-primary/50",
            )}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {isBusy ? (
              <span className="inline-flex items-center gap-1.5">
                <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
                {confirmButton.text}
              </span>
            ) : (
              confirmButton.text
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Connect `useMessageDialogStore` / `messageDialogService.open`.
 */
export function MessageDialog() {
  const { isOpen, content, closeMessageDialog } = useMessageDialogStore(
    useShallow((s) => ({
      isOpen: s.isOpen,
      content: s.content,
      closeMessageDialog: s.closeMessageDialog,
    })),
  );

  if (!isOpen || !content) {
    return null;
  }

  return (
    <MessageDialogView
      isOpen={isOpen}
      onOpenChange={(next) => {
        if (!next) closeMessageDialog();
      }}
      content={content}
    />
  );
}
