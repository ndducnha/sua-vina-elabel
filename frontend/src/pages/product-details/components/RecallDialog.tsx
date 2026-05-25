import { DialogLayout } from "@/components/dialog/DialogLayout";
import { Label } from "@/components/ui/label";
import { TextArea } from "@/components/form/TextArea";
import { ProductStatus, type Product } from "@/models/product.model";
import { TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

interface RecallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
  onSave: (status: ProductStatus, reason?: string) => Promise<void>;
}
export function RecallDialog({ open, onOpenChange, product, onSave }: RecallDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [isLoading] = useState(false);

  const handleCancel = () => {
    onOpenChange(false);
    setReason("");
  };
  const handleConfirmClick = async () => {
    onSave(ProductStatus.RECALLED, reason);
  }

  return (
    <DialogLayout
      open={open}
      onOpenChange={(next) => {
        if (!next) return;
        onOpenChange(next);
      }}
      title={product.status === ProductStatus.RECALLED ? t("product.detail.editReasonTitle") : t("product.detail.recallTitle")}
      className="w-[90dvw] max-w-175!"
      description={product.status === ProductStatus.RECALLED ? t("product.detail.editReasonDescription") : t("product.detail.recallDescription")}
      showCloseButton={false}
      preventOutsideClick={true}
      size="full"
      actions={{
        cancel: {
          text: t("common.cancel") || "Hủy",
          onClick: handleCancel,
        },
        confirm: {
          text: product.status === ProductStatus.RECALLED ? t("product.detail.saveReason") : t("product.detail.confirmRecall"),
          onClick: handleConfirmClick,
          loading: isLoading,
          loadingText: t("common.saving") || "Đang lưu...",
          variant: "warning",
        },
      }}
    >
      <div className="px-1">
        {product.status !== ProductStatus.RECALLED ? (
          <p
            className="mb-3 flex items-center rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-900 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
            role="note"
          >
            <TriangleAlert className="size-4 text-amber-500" />
            <span className="ml-2">{t("product.detail.recallBatchesWarning")}</span>
          </p>
        ) : null}
        <Label htmlFor="recall-reason" className="mb-2 block text-sm font-medium">
          {t("product.detail.recallReasonLabel") || "Lý do thu hồi"}
        </Label>
        <TextArea
          id="recall-reason"
          className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder={t("product.detail.recallReasonPlaceholder") || "Nhập lý do thu hồi sản phẩm..."}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          maxLength={500}
        />
      </div>
    </DialogLayout>
  );
}
