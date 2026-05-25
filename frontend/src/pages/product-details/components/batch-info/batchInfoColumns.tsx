import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import {
  AlertTriangle,
  Download,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import type { DynamicTableColumnMeta } from "@/components/dynamic-table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getAppendixFieldLabel, type AppendixFieldRow } from "@/models/field.model";
import { ProductStatus } from "@/models/product.model";
import { BatchStatus, parseProductBatchStatus, type ProductBatch } from "@/models/product-batch.model";
import { formatManufacturingDateForTableCell } from "@/pages/product-details/utils/batch-form";
import { formatAppendixDisplayValue, formatTruthyAttributeDisplayValue } from "@/pages/product-details/utils/product-meta";
import {
  getAdditionalAttributeCellValue,
  getBatchAttributeStringValue,
  type AdditionalAttributeColumnSpec,
} from "@/pages/product-details/utils/batch-table";

const BATCH_TABLE_RIGHT_ACTIONS_BAND_PX = 108;
const BATCH_TABLE_RIGHT_ACTIONS_CONTENT_W_PX = BATCH_TABLE_RIGHT_ACTIONS_BAND_PX - 24;

function statusPillClass(status: BatchStatus): string {
  const base = "inline-flex max-w-full whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium";
  if (status === BatchStatus.DRAFT) {
    return cn(base, "bg-muted text-muted-foreground");
  }
  if (status === BatchStatus.PUBLISHED) {
    return cn(base, "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300");
  }
  if (status === BatchStatus.RECALLED) {
    return cn(base, "bg-red-500/15 text-red-900 dark:text-red-200");
  }
  return base;
}

export type BatchInfoColumnsContext = {
  locale: string;
  getBatchStatusLabel: (status: BatchStatus) => string;
  onRowEdit: (productBatch: ProductBatch) => void;
  onRowDownload: (productBatch: ProductBatch) => void;
  onRowPublish: (productBatch: ProductBatch) => void;
  onRowRecall: (productBatch: ProductBatch) => void;
  isBatchStateActionPending: (batchRowId: string) => boolean;
  onRowDelete: (productBatch: ProductBatch) => void;
  isManualProduct?: boolean;
  /** Product-level status; when not `published`, lot publish/recall actions are hidden behind a static hint. */
  productStatus?: ProductStatus;
};

function additionalAttrColumnId(fieldCode: string): string {
  return `additional_attr_${fieldCode.replace(/[^a-zA-Z0-9_-]+/g, "_")}`;
}

function productLotActionsHintKey(productStatus: ProductStatus): string {
  if (productStatus === ProductStatus.DRAFT) {
    return "product.detail.batch.table.productDraftLotActionsHint";
  }
  return "product.detail.batch.table.productRecalledLotActionsHint";
}

export function createBatchInfoColumns(
  translate: TFunction,
  ctx: BatchInfoColumnsContext,
  appendixFields: AppendixFieldRow[] = [],
  /** One table column per distinct field (see `collectAdditionalAttributeColumnSpecs`). */
  additionalAttributeColumns: AdditionalAttributeColumnSpec[] = []
): ColumnDef<ProductBatch, unknown>[] {
  const additionalCols: ColumnDef<ProductBatch, unknown>[] = additionalAttributeColumns.map(
    (spec) => ({
      id: additionalAttrColumnId(spec.fieldCode),
      header: spec.headerLabel,
      enableSorting: false,
      cell: ({ row }) => {
        const raw = getAdditionalAttributeCellValue(row.original, spec.fieldCode);
        if (!raw) {
          return <span className="text-muted-foreground">—</span>;
        }
        const display = formatTruthyAttributeDisplayValue(spec.headerLabel, raw);
        return (
          <div className="max-w-[180px] truncate text-sm" title={display}>
            {display}
          </div>
        );
      },
    })
  );

  const appendixCols: ColumnDef<ProductBatch, unknown>[] = appendixFields
    .slice()
    .sort((left, right) => left.display_order - right.display_order)
    .map((appendixField) => ({
      id: `appendix_${appendixField.field_id}`,
      header: getAppendixFieldLabel(appendixField, ctx.locale),
      enableSorting: false,
      cell: ({ row }) => {
        const raw = getBatchAttributeStringValue(row.original, appendixField.field_id);
        if (!raw) {
          return <span className="text-muted-foreground">—</span>;
        }
        const fieldLabel = getAppendixFieldLabel(appendixField, ctx.locale);
        const display = formatAppendixDisplayValue(fieldLabel, raw, appendixField.data_type);
        return (
          <div className="max-w-[180px] truncate text-sm" title={display}>
            {display}
          </div>
        );
      },
    }));

  return [
    {
      id: "batch_code",
      accessorKey: "batch_code",
      header: translate("product.detail.batch.table.colBatchCode"),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="max-w-[200px] truncate font-medium" title={row.original.batch_code}>
          {row.original.batch_code}
        </div>
      ),
    },
    {
      id: "manufacturing_date",
      accessorKey: "manufacturing_date",
      header: translate("product.detail.batch.table.colMfg"),
      enableSorting: true,
      cell: ({ row }) =>
        formatManufacturingDateForTableCell(row.original.manufacturing_date, ctx.locale),
    },
    {
      id: "total_quantity",
      accessorKey: "total_quantity",
      header: translate("product.detail.batch.table.colQty"),
      enableSorting: false,
      cell: ({ row }) => (
        <span className="tabular-nums">
          {Number.isFinite(row.original.total_quantity) ? row.original.total_quantity : "—"}
        </span>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: translate("product.detail.batch.table.colStatus"),
      enableSorting: false,
      cell: ({ row }) => {
        const batchStatus = parseProductBatchStatus(row.original.status);
        const displayBatchStatus =
          ctx.productStatus === ProductStatus.RECALLED
            ? BatchStatus.RECALLED
            : batchStatus;
        const statusTitle =
          ctx.productStatus === ProductStatus.RECALLED
            ? ctx.getBatchStatusLabel(BatchStatus.RECALLED)
            : row.original.status;
        return (
          <span className={statusPillClass(displayBatchStatus)} title={statusTitle}>
            {ctx.getBatchStatusLabel(displayBatchStatus)}
          </span>
        );
      },
    },
    {
      id: "traceability",
      header: ctx.isManualProduct
        ? translate("product.detail.batch.table.colDetailLink")
        : translate("product.detail.batch.table.colTrace"),
      enableSorting: false,
      cell: ({ row }) => {
        const url = row.original.traceability_url?.trim();
        if (!url) {
          return <span className="text-muted-foreground">—</span>;
        }
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-secondary inline-flex max-w-[220px] items-center gap-1 truncate text-sm font-medium hover:underline"
            title={url}
            onClick={(event) => event.stopPropagation()}
          >
            {ctx.isManualProduct
              ? translate("product.detail.batch.table.traceDetailLink")
              : translate("product.detail.batch.table.traceLink")}
            <ExternalLink className="size-3.5 shrink-0 opacity-80" aria-hidden />
          </a>
        );
      },
    },
    ...appendixCols,
    ...additionalCols,
    {
      id: "operations",
      header: translate("product.detail.batch.table.colOperations"),
      enableSorting: false,
      meta: {
        sticky: "right",
        stickyOffset: `${BATCH_TABLE_RIGHT_ACTIONS_BAND_PX}px`,
      } satisfies DynamicTableColumnMeta<ProductBatch>,
      cell: ({ row }) => {
        const productBatch = row.original;
        return (
          <div
            className="flex w-max min-w-0 items-center justify-end gap-0.5"
            onClick={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-8"
              aria-label={translate("product.detail.batch.table.actionEdit")}
              onClick={() => ctx.onRowEdit(productBatch)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground size-8"
              aria-label={translate("product.detail.batch.table.actionDownload")}
              onClick={() => ctx.onRowDownload(productBatch)}
            >
              <Download className="size-4" />
            </Button>
            {productBatch.status === BatchStatus.DRAFT ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive/80 size-8 shrink-0 hover:text-destructive"
                aria-label={translate("product.detail.batch.table.actionDelete")}
                onClick={() => ctx.onRowDelete(productBatch)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "batchRowActions",
      header: translate("product.detail.batch.table.colActions"),
      enableSorting: false,
      meta: { sticky: "right" } satisfies DynamicTableColumnMeta<ProductBatch>,
      cell: ({ row }) => {
        const productBatch = row.original;
        const batchStatus = parseProductBatchStatus(productBatch.status);
        const isStatusActionPending = ctx.isBatchStateActionPending(productBatch.id);
        const staticLotActionsHintKey =
          ctx.productStatus !== undefined && ctx.productStatus !== ProductStatus.PUBLISHED
            ? productLotActionsHintKey(ctx.productStatus)
            : null;
        return (
          <div
            className="flex min-w-0 shrink-0 items-center justify-end gap-1"
            style={{
              width: BATCH_TABLE_RIGHT_ACTIONS_CONTENT_W_PX,
              minWidth: BATCH_TABLE_RIGHT_ACTIONS_CONTENT_W_PX,
            }}
            onClick={(event) => event.stopPropagation()}
          >
            {staticLotActionsHintKey ? (
              <Tooltip>
                <TooltipTrigger
                  className="text-muted-foreground inline-flex size-8 cursor-default items-center justify-center"
                  aria-label={translate(staticLotActionsHintKey)}
                >
                  <AlertTriangle className="size-4 shrink-0 opacity-30 text-warning-500" aria-hidden />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{translate(staticLotActionsHintKey)}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <>
                {(batchStatus === BatchStatus.DRAFT || batchStatus === BatchStatus.RECALLED) && (
                  <Button
                    type="button"
                    size="sm"
                    className="p-4 bg-primary text-white"
                    onClick={() => ctx.onRowPublish(productBatch)}
                    disabled={isStatusActionPending}
                  >
                    {translate("product.detail.publish")}
                  </Button>
                )}
                {batchStatus === BatchStatus.PUBLISHED && (
                  <Button
                    type="button"
                    size="sm"
                    className="p-4 bg-white text-black hover:bg-gray-200"
                    onClick={() => ctx.onRowRecall(productBatch)}
                    disabled={isStatusActionPending}
                  >
                    {translate("product.detail.recall")}
                  </Button>
                )}
              </>
            )}
          </div>
        );
      },
    },
  ];
}
