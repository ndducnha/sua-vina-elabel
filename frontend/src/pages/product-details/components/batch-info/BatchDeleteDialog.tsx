import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { deleteProductBatch } from "@/api/product-batches";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BatchStatus, parseProductBatchStatus, type ProductBatch } from "@/models/product-batch.model";

type BatchDeleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batch: ProductBatch | null;
  productId: string;
};

export function BatchDeleteDialog({
  open,
  onOpenChange,
  batch,
  productId,
}: BatchDeleteDialogProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (isDeleting) return;
      onOpenChange(next);
    },
    [isDeleting, onOpenChange]
  );

  const handleConfirm = useCallback(async () => {
    if (!batch) return;
    setIsDeleting(true);
    try {
      await deleteProductBatch(productId, batch.id);
      const code = batch.batch_code?.trim() ?? batch.id;
      toast.success(t("product.detail.batch.dialog.deleteSuccess", { code }));
      await queryClient.invalidateQueries({ queryKey: ["product-batches", productId] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
      onOpenChange(false);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsDeleting(false);
    }
  }, [batch, onOpenChange, productId, queryClient, t]);

  if (!batch) {
    return null;
  }

  const status = parseProductBatchStatus(batch.status);
  const isHighRisk = status === BatchStatus.PUBLISHED || status === BatchStatus.RECALLED;
  const description =
    status === BatchStatus.DRAFT
      ? t("product.detail.batch.dialog.deleteDialogDescriptionDraft", {
          series: batch.batch_code?.trim() ?? "—",
        })
      : status === BatchStatus.PUBLISHED
        ? t("product.detail.batch.dialog.deleteDialogDescriptionPublished")
        : t("product.detail.batch.dialog.deleteDialogDescriptionRecalled");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>{t("product.detail.batch.dialog.deleteDialogTitle")}</DialogTitle>
          <DialogDescription className="text-foreground/90">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex w-full min-w-0 flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isDeleting}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={isHighRisk ? "destructive" : "default"}
            onClick={() => void handleConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? t("common.loading") : t("product.detail.batch.dialog.deleteConfirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
