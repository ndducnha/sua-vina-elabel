import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

import { DialogLayout } from "@/components/dialog/DialogLayout";
import { DynamicForm } from "@/components/dynamic-form";
import { Button } from "@/components/ui/button";

import type { BatchDetailsFormValues } from "../../utils/batch-form";

import { BatchExtraColumnsEditor } from "./BatchExtraColumnsEditor";
import {
  useBatchDetailsDialog,
  type BatchDetailsDialogProps,
} from "../../hooks/useBatchDetailsDialog";

export type { BatchDetailsDialogProps };

/**
 * Add / edit batch (lot) for a product. Form layout only; behavior lives in `useBatchDetailsDialog`.
 */
export function BatchDetailsDialog(props: BatchDetailsDialogProps) {
  const {
    formId,
    open,
    onOpenChange,
    dialogTitle,
    dialogDescriptionText,
    publishedBatchSeriesEdited,
    publishedBatchSeriesWarningText,
    onCancel,
    formKey,
    defaultValues,
    fields,
    batchSchema,
    onFormStateChange,
    onSubmit,
    isFormSubmitting,
    isFormValid,
    savedExtraColumnFieldCodes,
    t,
  } = useBatchDetailsDialog(props);

  return (
    <DialogLayout
      open={open}
      onOpenChange={onOpenChange}
      preventOutsideClick
      title={dialogTitle}
      description={
        publishedBatchSeriesEdited ? (
          <div className="space-y-2">
            <span className="block">{dialogDescriptionText}</span>
            <p
              className="border border-amber-500/40 bg-amber-500/10 text-amber-800 text-sm font-medium wrap-break-word rounded-md p-2.5 dark:border-amber-500/50 dark:bg-amber-500/10 dark:text-amber-200"
              role="status"
            >
              {publishedBatchSeriesWarningText}
            </p>
          </div>
        ) : (
          dialogDescriptionText
        )
      }
      titleClassName="text-foreground text-xl font-semibold"
      size="lg"
      className="w-full max-w-full sm:max-w-lg"
      showCloseButton
      contentClassName="pt-0 max-h-[min(64vh,36rem)] overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] pr-0.5"
      footer={
        <>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="w-full sm:w-auto"
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            className="w-full sm:w-auto"
            disabled={isFormSubmitting || !isFormValid}
          >
            {t("product.detail.batch.dialog.save")}
          </Button>
        </>
      }
    >
      <DynamicForm<BatchDetailsFormValues>
        key={formKey}
        id={formId}
        fields={fields}
        formOptions={{
          defaultValues,
          mode: "onChange",
          resolver: zodResolver(batchSchema as never) as Resolver<BatchDetailsFormValues>,
        }}
        className="space-y-3 pt-1"
        submitLabel={t("product.detail.batch.dialog.save")}
        hideDefaultSubmit
        footer={
          <BatchExtraColumnsEditor savedExtraColumnFieldCodes={savedExtraColumnFieldCodes} />
        }
        onStateChange={onFormStateChange}
        onSubmit={onSubmit}
      />
    </DialogLayout>
  );
}
