import { Check, Download, Menu, Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { DynamicDataTable, DynamicTableFilters, TablePagination } from "@/components/dynamic-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProductBatch } from "@/models/product-batch.model";
import { BatchStatus, parseProductBatchStatus } from "@/models/product-batch.model";
import { ProductStatus } from "@/models/product.model";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { ProductBatchesTableViewModel } from "../../hooks/useProductBatchesTable";

type BatchTableProps = ProductBatchesTableViewModel & {
  onAddBatch?: () => void;
  onBulkPublish?: (batches: ProductBatch[]) => void | Promise<void>;
  onBulkDownload?: (batches: ProductBatch[]) => void | Promise<void>;
  onBulkDelete?: (batches: ProductBatch[]) => void;
  bulkActionDisabled?: boolean;
  /** When product is not published, bulk publish is disabled (matches per-row lot actions). */
  productStatus?: ProductStatus;
};

export function BatchTable(props: BatchTableProps) {
  const { t } = useTranslation();
  const {
    onAddBatch,
    onBulkPublish,
    onBulkDownload,
    onBulkDelete,
    bulkActionDisabled,
    productStatus,
    query,
    isFetching,
    items,
    total,
    columns,
    filterFields,
    sortingState,
    onFilterValuesChange,
    onClearFilters,
    onSortingChange,
    onPageChange,
    onPageSizeChange,
    getRowId,
    rowSelection,
    onRowSelectionChange,
    selectedBatches,
  } = props;

  const bulkPublishDisabledAllPublished =
    selectedBatches.length > 0 &&
    selectedBatches.every((b) => parseProductBatchStatus(b.status) === BatchStatus.PUBLISHED);

  const effectiveProductStatus = productStatus ?? ProductStatus.PUBLISHED;
  const bulkPublishBlockedByMaster = effectiveProductStatus !== ProductStatus.PUBLISHED;
  const bulkPublishMasterHintKey = bulkPublishBlockedByMaster
    ? effectiveProductStatus === ProductStatus.DRAFT
      ? "product.detail.batch.table.productDraftLotActionsHint"
      : "product.detail.batch.table.productRecalledLotActionsHint"
    : null;

  const bulkPublishDisabled =
    bulkActionDisabled || bulkPublishDisabledAllPublished || bulkPublishBlockedByMaster;

  const bulkPublishButton =
    onBulkPublish != null ? (
      <Button
        type="button"
        size="sm"
        className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        disabled={bulkPublishDisabled}
        onClick={() => void onBulkPublish(selectedBatches)}
      >
        <Check className="size-4 shrink-0" aria-hidden />
        {t("product.detail.batch.bulkPublish")}
      </Button>
    ) : null;

  const selectionToolbarActions =
    onBulkPublish || onBulkDownload || onBulkDelete ? (
      <>
        {bulkPublishMasterHintKey != null && bulkPublishButton ? (
          <Tooltip>
            <TooltipTrigger>{bulkPublishButton}</TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-pretty">
              <p>{t(bulkPublishMasterHintKey)}</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          bulkPublishButton
        )}
        {onBulkDownload ? (
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-secondary text-white hover:bg-secondary/90"
            onClick={() => void onBulkDownload(selectedBatches)}
          >
            <Download className="size-4 shrink-0" aria-hidden />
            {t("product.detail.batch.bulkDownloadQr")}
          </Button>
        ) : null}
        {onBulkDelete ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 border-destructive/50 text-destructive hover:bg-destructive/10"
            disabled={bulkActionDisabled}
            onClick={() => onBulkDelete(selectedBatches)}
          >
            <Trash2 className="size-4 shrink-0" aria-hidden />
            {t("product.detail.batch.bulkDelete")}
          </Button>
        ) : null}
      </>
    ) : undefined;

  return (
    <Card>
      <CardHeader className="border-b pb-4">
        <div className="flex min-w-0 w-full items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Menu className="text-primary size-5 shrink-0" />
            <CardTitle className="min-w-0 text-primary">
              {t("product.detail.batch.title")}
            </CardTitle>
            <Badge variant="secondary" className="font-normal bg-bg-primary text-secondary border-secondary-foreground">
              {t("product.detail.batch.count", { count: total })}
            </Badge>
          </div>
          {onAddBatch ? (
            <CardAction>
              <Button type="button" className="gap-1.5" size="sm" onClick={onAddBatch}>
                <Plus className="size-4" />
                {t("product.detail.batch.add")}
              </Button>
            </CardAction>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-2">
          <div className="min-w-0 flex-1">
            <DynamicTableFilters
              fields={filterFields}
              values={query.filters}
              onValuesChange={onFilterValuesChange}
              showSubmitButton={false}
              className="rounded-none md:gap-2 [&_select]:h-9 [&_select]:min-h-9"
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground h-9 shrink-0"
            onClick={onClearFilters}
          >
            {t("product.detail.batch.clearFilters")}
          </Button>
        </div>

        <DynamicDataTable
          data={items}
          columns={columns}
          sorting={sortingState}
          onSortingChange={onSortingChange}
          showCheckbox
          rowSelection={rowSelection}
          onRowSelectionChange={onRowSelectionChange}
          getRowId={getRowId}
          selectionToolbarActions={selectionToolbarActions}
          isLoading={isFetching}
          loadingLabel={t("common.loading")}
          emptyLabel={t("common.noData")}
          className="min-w-5xl"
        />

        <TablePagination
          page={query.page}
          pageSize={query.pageSize}
          total={total}
          disabled={isFetching}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={[50, 100, 200]}
        />
      </CardContent>
    </Card>
  );
}
