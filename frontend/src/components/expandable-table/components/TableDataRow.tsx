import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { cellErrorKey } from "../utils/expandableTableValidation";
import {
  permanentDataColumnLeft,
  resolveColumnMinWidthPx,
  resolveLastLeftStickyEdgeKey,
  STICKY_LEFT_STACK_OUTER_SHADOW,
  STICKY_RIGHT_STACK_OUTER_SHADOW,
  stickyIndexCellStyle,
} from "../utils/stickyColumns";
import { TableCellInput } from "./TableCellInput";
import type { ExpandableTableViewProps } from "./types";
import type { InternalColumn, InternalRow } from "../types";

function ReadOnlyCellDisplay({ value }: { value: string }) {
  if (!value) {
    return <span className="block min-w-0 text-sm" />;
  }
  return (
    <Tooltip>
      <TooltipTrigger className="flex w-full min-w-0 cursor-default">
        <span className="block w-full min-w-0 truncate text-left text-sm">{value}</span>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="start"
        className="max-w-[min(90vw,28rem)] text-pretty wrap-break-word"
      >
        {value}
      </TooltipContent>
    </Tooltip>
  );
}

type DataRowProps = {
  row: InternalRow;
  rowIndex: number;
  tableColumns: InternalColumn[];
  validation: ExpandableTableViewProps["validation"];
  rowCellValidationSig: string;  // Precomputed in parent: `rowCellValidationSignature` for this row.
  locale: ExpandableTableViewProps["locale"];
  showIndexColumn: ExpandableTableViewProps["showIndexColumn"];
  cellInputPlaceholder: ExpandableTableViewProps["cellInputPlaceholder"];
  removeRowTooltip: ExpandableTableViewProps["removeRowTooltip"];
  isReadOnly: ExpandableTableViewProps["isReadOnly"];
  onSetCellValue: ExpandableTableViewProps["onSetCellValue"];
  onRemoveRowById: ExpandableTableViewProps["onRemoveRowById"];
  onClickRow?: (row: InternalRow) => void;
};

function TableDataRowInner({
  row,
  rowIndex,
  tableColumns,
  validation,
  rowCellValidationSig,
  showIndexColumn,
  cellInputPlaceholder,
  removeRowTooltip,
  isReadOnly,
  onSetCellValue,
  onRemoveRowById,
  onClickRow,
  locale,
}: DataRowProps) {
  const { t } = useTranslation();
  void rowCellValidationSig;
  void locale;
  const lastLeftStickyEdgeKey = useMemo(
    () => resolveLastLeftStickyEdgeKey(tableColumns, showIndexColumn),
    [tableColumns, showIndexColumn],
  );
  const permanentBeforeByColIndex = useMemo(
    () =>
      tableColumns.map((_, i) =>
        tableColumns.slice(0, i).filter((c) => c.permanent).length
      ),
    [tableColumns]
  );
  const rowActionCellClassName = cn(
    "px-2 py-2 align-top",
    "sticky right-0 z-10 bg-background",
    STICKY_RIGHT_STACK_OUTER_SHADOW,
  );

  return (
    <TableRow onClick={onClickRow ? () => onClickRow(row) : undefined} className={cn(onClickRow && "cursor-pointer")}>
      {showIndexColumn && (
        <TableCell
          style={stickyIndexCellStyle}
          className={cn(
            "px-2 py-2 align-top text-center text-sm font-medium",
            "sticky left-0 z-20 bg-background",
            lastLeftStickyEdgeKey === "index" && STICKY_LEFT_STACK_OUTER_SHADOW,
          )}
        >
          {rowIndex + 1}
        </TableCell>
      )}
      {tableColumns.map((column, colIndex) => {
        const sticky = column.permanent;
        const left = sticky
          ? permanentDataColumnLeft(
              showIndexColumn,
              permanentBeforeByColIndex[colIndex] ?? 0
            )
          : undefined;

        const errKey = cellErrorKey(row.id, column.key);
        const cellErr = validation.cellErrorByKey.get(errKey);
        const columnErr = validation.columnErrorByKey.get(column.key);
        const displayErr = cellErr ?? columnErr;
        const phaseFeedback = validation.cellPhaseFeedbackByKey.get(errKey);
        const cellUneditable = column.disabled;

        const colMinW = resolveColumnMinWidthPx(column);
        const cellWidthLock = {
          width: colMinW,
          minWidth: colMinW,
          maxWidth: colMinW,
        } as const;
        const resolvedCellPlaceholder = column.cellPlaceholderI18nKey
          ? t(column.cellPlaceholderI18nKey)
          : column.cellPlaceholder ?? cellInputPlaceholder;
        return (
          <TableCell
            key={`${row.id}-${column.key}`}
            style={
              sticky
                ? { left, ...cellWidthLock }
                : cellWidthLock
            }
            className={cn(
              "min-w-0 px-2 py-2 align-top",
              sticky && "sticky z-20 bg-background",
              sticky &&
                column.key === lastLeftStickyEdgeKey &&
                STICKY_LEFT_STACK_OUTER_SHADOW,
            )}
          >
            {isReadOnly ? (
              <ReadOnlyCellDisplay value={row.values[column.key] ?? ""} />
            ) : (
            <TableCellInput
              rowId={row.id}
              columnKey={column.key}
              value={row.values[column.key] ?? ""}
              placeholder={resolvedCellPlaceholder}
              inputType={column.inputType}
              rowIndex={rowIndex}
              errorMessage={displayErr}
              phaseFeedback={phaseFeedback}
              disabled={cellUneditable}
              min={column.min}
              max={column.max}
              onSetCellValue={onSetCellValue}
            />)}
          </TableCell>
        );
      })}
      {!isReadOnly && (
      <TableCell className={rowActionCellClassName}>
        <div className="flex min-h-9 items-start justify-end">
          {row.removable ? (
            <Tooltip>
              <TooltipTrigger className="inline-flex shrink-0">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => onRemoveRowById(row.id)}
                  aria-label={removeRowTooltip}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{removeRowTooltip}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </TableCell>
      )}
    </TableRow>
  );
}

function areRowPropsEqual(prev: DataRowProps, next: DataRowProps): boolean {
  if (prev.row !== next.row || prev.rowIndex !== next.rowIndex) return false;
  if (prev.tableColumns !== next.tableColumns) return false;
  if (prev.rowCellValidationSig !== next.rowCellValidationSig) return false;
  if (prev.locale !== next.locale) return false;
  return (
    prev.showIndexColumn === next.showIndexColumn &&
    prev.cellInputPlaceholder === next.cellInputPlaceholder &&
    prev.removeRowTooltip === next.removeRowTooltip &&
    prev.onSetCellValue === next.onSetCellValue &&
    prev.onRemoveRowById === next.onRemoveRowById &&
    prev.isReadOnly === next.isReadOnly
  );
}

export const TableDataRow = memo(TableDataRowInner, areRowPropsEqual);
