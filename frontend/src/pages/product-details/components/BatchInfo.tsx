import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  bulkDeleteProductBatches,
  bulkUpdateProductBatchStatus,
  enqueueBulkBatchQrJob,
  updateProductBatchStatus,
} from "@/api/product-batches";
import { messageDialogService } from "@/components/dialog/messageDialog";
import {
  parseProductStatus,
  ProductStatus,
  type Product,
} from "@/models/product.model";
import {
  BatchStatus,
  parseProductBatchStatus,
  type ProductBatch,
} from "@/models/product-batch.model";

import { runClientZipManagerJob } from "@/components/task-manager/utils/client-zip-manager-runner";
import { QR_TASK_MODE, useTaskStore } from "@/stores/task.store";

import { useProductBatchesTable } from "../hooks/useProductBatchesTable";
import { downloadBatchQrPng } from "../utils/batch-qr-download";

import {
  BatchDeleteDialog,
  BatchDetailsDialog,
  BatchRecallDialog,
  BatchTable,
} from "./batch-info";

/** Above this count → async QR job; at most this count → client-side ZIP in browser. */
const BULK_QR_JOB_BATCH_THRESHOLD = 200;

type BatchInfoProps = {
  product: Product;
};

/** Batch section on product details: table and batch add/edit dialog. */
export function BatchInfo({ product }: BatchInfoProps) {
  const { t: translate } = useTranslation();
  const queryClient = useQueryClient();
  const productId = product.id;
  const productStatus = parseProductStatus(product.status);
  const [batchDetailsDialog, setBatchDetailsDialog] = useState<{
    open: boolean;
    mode: "create" | "edit";
    batch: ProductBatch | null;
  }>({ open: false, mode: "create", batch: null });
  const [batchPendingDelete, setBatchPendingDelete] = useState<ProductBatch | null>(null);
  const [batchPendingRecall, setBatchPendingRecall] = useState<ProductBatch | null>(null);
  const [statusActionBatchId, setStatusActionBatchId] = useState<string | null>(null);
  const [bulkActionPending, setBulkActionPending] = useState(false);

  const onRequestEdit = useCallback((productBatch: ProductBatch) => {
    setBatchDetailsDialog({ open: true, mode: "edit", batch: productBatch });
  }, []);

  const onRequestDelete = useCallback((productBatch: ProductBatch) => {
    setBatchPendingDelete(productBatch);
  }, []);

  const onRequestDownload = useCallback(
    (productBatch: ProductBatch) => {
      void (async () => {
        try {
          await downloadBatchQrPng({
            productGtin: product.gtin,
            productSku: product.sku,
            batch: productBatch,
          });
          toast.success(
            translate("product.detail.batch.qrDownloadSuccess", {
              code: productBatch.batch_code?.trim() ?? productBatch.id,
            })
          );
        } catch {
          toast.error(translate("product.detail.batch.qrDownloadError"));
        }
      })();
    },
    [product.gtin, product.sku, translate]
  );

  const onAddBatch = useCallback(() => {
    setBatchDetailsDialog({ open: true, mode: "create", batch: null });
  }, []);

  const isBatchStateActionPending = useCallback(
    (batchRowId: string) => statusActionBatchId === batchRowId,
    [statusActionBatchId]
  );

  const updateBatchToPublishedAsync = useCallback(
    async (targetBatch: ProductBatch) => {
      setStatusActionBatchId(targetBatch.id);
      try {
        await updateProductBatchStatus(productId, targetBatch.id, {
          status: BatchStatus.PUBLISHED,
        });
        const displayCode = targetBatch.batch_code?.trim() ?? targetBatch.id;
        toast.success(translate("product.detail.batch.toast.published", { code: displayCode }));
        await queryClient.invalidateQueries({ queryKey: ["product-batches", productId] });
      } catch {
        toast.error(translate("common.error"));
        throw new Error("updateProductBatchStatus failed");
      } finally {
        setStatusActionBatchId(null);
      }
    },
    [productId, queryClient, translate]
  );

  const onRequestPublish = useCallback(
    (productBatch: ProductBatch) => {
      void updateBatchToPublishedAsync(productBatch);
    },
    [updateBatchToPublishedAsync]
  );

  const onRequestRecall = useCallback((productBatch: ProductBatch) => {
    setBatchPendingRecall(productBatch);
  }, []);

  const batchTable = useProductBatchesTable(productId, {
    onRequestEdit,
    onRequestDelete,
    onRequestDownload,
    onRequestPublish,
    onRequestRecall,
    isBatchStateActionPending,
    product,
  });

  const { clearRowSelection } = batchTable;

  const isProductMasterDraft = parseProductStatus(product.status) === ProductStatus.DRAFT;

  const onBulkPublish = useCallback(
    (batches: ProductBatch[]) => {
      if (batches.length === 0) return;
      const toPublish = batches.filter(
        (b) => parseProductBatchStatus(b.status) !== BatchStatus.PUBLISHED
      );
      if (toPublish.length === 0) return;
      const count = toPublish.length;
      messageDialogService.open({
        context: "normal",
        title: translate("product.detail.batch.bulkPublishConfirmTitle", { count }),
        message: (
          <div className="space-y-3">
            <p>{translate("product.detail.batch.bulkPublishConfirmBody")}</p>
            {isProductMasterDraft ? (
              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {translate("product.detail.batch.bulkPublishMasterDraftWarning")}
              </p>
            ) : null}
          </div>
        ),
        cancelText: translate("common.cancel"),
        confirmButton: {
          text: translate("product.detail.batch.bulkPublish"),
          onSubmit: async () => {
            setBulkActionPending(true);
            try {
              const publishedCount = await bulkUpdateProductBatchStatus(productId, {
                batch_ids: toPublish.map((b) => b.id),
                status: BatchStatus.PUBLISHED,
              });
              toast.success(
                translate("product.detail.batch.bulkPublishSuccess", {
                  count: publishedCount,
                })
              );
              await queryClient.invalidateQueries({ queryKey: ["product-batches", productId] });
              clearRowSelection();
            } catch {
              toast.error(translate("common.error"));
              throw new Error("bulk publish failed");
            } finally {
              setBulkActionPending(false);
            }
          },
        },
      });
    },
    [
      clearRowSelection,
      isProductMasterDraft,
      productId,
      queryClient,
      translate,
    ]
  );

  const onBulkDownload = useCallback(
    async (batches: ProductBatch[]) => {
      if (batches.length === 0) return;

      if (batches.length <= BULK_QR_JOB_BATCH_THRESHOLD) {
        const tempId = `bulk-qr-client-${productId}-${Date.now()}`;
        const taskName = product.name.trim() || product.gtin || product.sku || productId;
        const { addTask } = useTaskStore.getState();
        addTask(tempId, taskName, {
          mode: QR_TASK_MODE.ClientZipManager,
          clientTotal: batches.length,
        });
        void runClientZipManagerJob({
          taskId: tempId,
          productGtin: product.gtin,
          productSku: product.sku,
          batches,
        }).catch((e) => {
          const aborted =
            (e instanceof DOMException && e.name === "AbortError") ||
            (e instanceof Error && e.name === "AbortError");
          if (aborted) return;
          console.error(e);
          toast.error(translate("productCreate.zipManager.zipFailed"));
        });
        return;
      }

      const tempId = `bulk-qr-${productId}-${Date.now()}`;
      const taskName = product.name.trim() || product.gtin || product.sku || productId;
      const { addTask, removeTask, startPolling } = useTaskStore.getState();

      addTask(tempId, taskName);
      setBulkActionPending(true);
      try {
        const response = await enqueueBulkBatchQrJob(productId, {
          batch_ids: batches.map((b) => b.id),
        });
        const qrJobId = response.data?.data?.qr_job_id;
        if (!qrJobId) {
          removeTask(tempId);
          toast.error(translate("common.error"));
          return;
        }
        startPolling(qrJobId, tempId);
      } catch (e) {
        console.error(e);
        removeTask(tempId);
        toast.error(translate("common.error"));
      } finally {
        setBulkActionPending(false);
      }
    },
    [product.gtin, product.name, product.sku, productId, translate]
  );

  const onBulkDelete = useCallback(
    (batches: ProductBatch[]) => {
      if (batches.length === 0) return;
      const count = batches.length;
      const publishedSelected = batches.filter(
        (b) => parseProductBatchStatus(b.status) === BatchStatus.PUBLISHED
      ).length;

      messageDialogService.open({
        context: "warning",
        title: translate("product.detail.batch.bulkDeleteConfirmTitle", { count }),
        message: (
          <div className="space-y-3">
            <p>{translate("product.detail.batch.bulkDeleteConfirmIntro", { count })}</p>
            {publishedSelected > 0 ? (
              <p className="text-destructive text-sm font-medium">
                {translate("product.detail.batch.bulkDeletePublishedWarning", {
                  count: publishedSelected,
                })}
              </p>
            ) : null}
          </div>
        ),
        cancelText: translate("common.cancel"),
        confirmButton: {
          text: translate("product.detail.batch.bulkDelete"),
          onSubmit: async () => {
            setBulkActionPending(true);
            try {
              await bulkDeleteProductBatches(productId, {
                batch_ids: batches.map((b) => b.id),
              });
              toast.success(translate("product.detail.batch.bulkDeleteSuccess", { count }));
              await queryClient.invalidateQueries({ queryKey: ["product-batches", productId] });
              clearRowSelection();
            } catch {
              toast.error(translate("common.error"));
              throw new Error("bulk delete failed");
            } finally {
              setBulkActionPending(false);
            }
          },
        },
      });
    },
    [clearRowSelection, productId, queryClient, translate]
  );

  return (
    <div className="flex flex-col gap-4">
      <BatchTable
        {...batchTable}
        onAddBatch={onAddBatch}
        onBulkPublish={onBulkPublish}
        onBulkDownload={onBulkDownload}
        onBulkDelete={onBulkDelete}
        bulkActionDisabled={bulkActionPending}
        productStatus={productStatus}
      />
      <BatchDetailsDialog
        open={batchDetailsDialog.open}
        onOpenChange={(isOpen) =>
          setBatchDetailsDialog((previous) => ({ ...previous, open: isOpen }))
        }
        product={product}
        productId={productId}
        mode={batchDetailsDialog.mode}
        batch={batchDetailsDialog.batch}
        appendixFields={batchTable.appendixFields}
        additionalAttributeColumnSpecs={batchTable.additionalAttributeColumns}
      />
      <BatchDeleteDialog
        open={batchPendingDelete != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setBatchPendingDelete(null);
        }}
        batch={batchPendingDelete}
        productId={productId}
      />
      <BatchRecallDialog
        open={batchPendingRecall != null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setBatchPendingRecall(null);
        }}
        batch={batchPendingRecall}
        productId={productId}
      />
    </div>
  );
}
