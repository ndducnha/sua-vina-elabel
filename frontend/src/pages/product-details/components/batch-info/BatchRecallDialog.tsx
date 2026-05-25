import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { updateProductBatchStatus } from "@/api/product-batches";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { BatchStatus, type ProductBatch } from "@/models/product-batch.model";

const RECALL_REASON_MAX = 500;

type BatchRecallDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
  productId: string;
};

export function BatchRecallDialog({
  open,
  onOpenChange,
  batch,
  productId,
}: BatchRecallDialogProps) {
  const { t: translate } = useTranslation();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && batch) {
      setReason("");
    }
  }, [open, batch?.id]);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isSubmitting) return;
      onOpenChange(next);
    },
    [isSubmitting, onOpenChange]
  );

  const handleConfirm = useCallback(async () => {
    if (!batch) return;
    setIsSubmitting(true);
    try {
      await updateProductBatchStatus(productId, batch.id, {
        status: BatchStatus.RECALLED,
        recall_reason: reason.trim() || undefined,
      });
      const displayCode = batch.batch_code?.trim() ?? batch.id;
      toast.success(translate("product.detail.batch.toast.recalled", { code: displayCode }));
      await queryClient.invalidateQueries({ queryKey: ["product-batches", productId] });
      onOpenChange(false);
    } catch {
      toast.error(translate("common.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [batch, onOpenChange, productId, queryClient, reason, translate]);

  if (!batch) {
    return null;
  }

  const batchSerial = batch.batch_code?.trim() ?? batch.id;
  const recallReasonLength = reason.length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isSubmitting}>
        <DialogHeader>
          <DialogTitle>
            {translate("product.detail.batch.dialog.recallTitle", { serial: batchSerial })}
          </DialogTitle>
          <DialogDescription className="text-foreground/90">
            {translate("product.detail.batch.dialog.recallDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="batch-recall-reason">
            {translate("product.detail.batch.dialog.recallReasonLabel")}
          </label>
          <textarea
            id="batch-recall-reason"
            rows={4}
            maxLength={RECALL_REASON_MAX}
            value={reason}
            onChange={(changeEvent) =>
              setReason(changeEvent.target.value.slice(0, RECALL_REASON_MAX))
            }
            placeholder={translate("product.detail.batch.dialog.recallReasonPlaceholder")}
            disabled={isSubmitting}
            className={cn(
              "border-input bg-background ring-offset-background placeholder:text-muted-foreground",
              "flex min-h-[100px] w-full rounded-lg border px-3 py-2 text-sm transition-[color,box-shadow]",
              "outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
              "dark:bg-input/30"
            )}
          />
          <p className="text-muted-foreground text-right text-xs tabular-nums">
            {translate("product.detail.batch.dialog.recallReasonCounter", {
              current: recallReasonLength,
              max: RECALL_REASON_MAX,
            })}
          </p>
        </div>
        <div className="flex w-full min-w-0 flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {translate("common.cancel")}
          </Button>
          <Button
            type="button"
            className="bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500/40 dark:bg-orange-600 dark:hover:bg-orange-500"
            onClick={() => void handleConfirm()}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? translate("common.loading")
              : translate("product.detail.batch.dialog.recallConfirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
