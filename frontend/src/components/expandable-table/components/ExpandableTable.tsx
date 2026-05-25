import { useLayoutEffect, useMemo, useRef } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { headerRowValidationSignature, rowCellValidationSignature } from "../utils/expandableTableValidation";
import { STICKY_INDEX_WIDTH, resolveColumnMinWidthPx } from "../utils/stickyColumns";
import { TableDataRow } from "./TableDataRow";
import { TableHeaderRow } from "./TableHeaderRow";
import { ResetMenu } from "./ResetMenu";
import type { ExpandableTableViewProps } from "./types";

export function ExpandableTable({
  tableColumns,
  tableRows,
  validation,
  locale,
  hasAnyColumn,
  showIndexColumn,
  addColumnButtonText,
  addRowButtonText,
  headerInputPlaceholder,
  cellInputPlaceholder,
  emptyNoRowsMessage,
  emptyNoColumnsMessage,
  indexColumnLabel,
  removeColumnTooltip,
  removeRowTooltip,
  className,
  isReadOnly = false,
  onAppendColumn,
  onRemoveColumnByKey,
  onAppendRow,
  onRemoveRowById,
  onSetColumnHeader,
  onSetCellValue,
  onResetAllTableData,
  onResetAllAddedColumns,
  onResetAllAddedRows,
  onClickRow,
  tableTitle,
}: ExpandableTableViewProps) {
  const scrollXRef = useRef<HTMLDivElement>(null);
  const prevColCountRef = useRef<number | null>(null);
  const headerValidationSig = headerRowValidationSignature(validation);

  const canResetAllData = useMemo(() => {
    if (!tableColumns.length) return false;
    const anyHeader = tableColumns.some((c) => c.removable && c.header !== "");
    if (anyHeader) return true;
    return tableRows.some((row) =>
      tableColumns.some((col) => (row.values[col.key] ?? "") !== "")
    );
  }, [tableColumns, tableRows]);

  const canRemoveAddedColumns = useMemo(
    () => tableColumns.some((c) => c.removable),
    [tableColumns]
  );
  const canRemoveAddedRows = useMemo(
    () => tableRows.some((r) => r.removable),
    [tableRows]
  );

  useLayoutEffect(() => {
    if (prevColCountRef.current != null && tableColumns.length > prevColCountRef.current && !isReadOnly) {
      const el = scrollXRef.current;
      if (el) {
        el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
      }
    }
    prevColCountRef.current = tableColumns.length;
  }, [tableColumns.length]);

  const showToolbar = tableTitle != null || !isReadOnly;

  return (
    <div className={cn("min-w-0 space-y-3", className)}>
      {showToolbar ? (
        <div className="flex min-w-0 items-center justify-between gap-4">
          {tableTitle != null ? (
            <div className="min-w-0 flex-1">{tableTitle}</div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          {!isReadOnly ? (
            <div className="shrink-0">
              <ResetMenu
                canResetAllData={canResetAllData}
                canRemoveAddedColumns={canRemoveAddedColumns}
                canRemoveAddedRows={canRemoveAddedRows}
                onResetAllTableData={onResetAllTableData}
                onResetAllAddedColumns={onResetAllAddedColumns}
                onResetAllAddedRows={onResetAllAddedRows}
              />
            </div>
          ) : null}
        </div>
      ) : null}
      <div
        ref={scrollXRef}
        className="relative box-border w-full min-w-0 overflow-x-auto rounded-lg border"
      >
        <Table
          noWrapper
          className="w-max min-w-full table-fixed border-separate border-spacing-0"
        >
          <colgroup>
            {showIndexColumn ? (
              <col style={{ width: STICKY_INDEX_WIDTH, minWidth: STICKY_INDEX_WIDTH }} />
            ) : null}
            {tableColumns.map((column) => {
              const w = resolveColumnMinWidthPx(column);
              return (
                <col key={column.key} style={{ width: w, minWidth: w, maxWidth: w }} />
              );
            })}
            {!isReadOnly && <col style={{ width: 130, minWidth: 130 }} />}
          </colgroup>
          <TableHeader className="bg-[#F7F8FC] [&_tr]:border-b-0">
            <TableHeaderRow
              tableColumns={tableColumns}
              validation={validation}
              headerValidationSig={headerValidationSig}
              locale={locale}
              showIndexColumn={showIndexColumn}
              addColumnButtonText={addColumnButtonText}
              headerInputPlaceholder={headerInputPlaceholder}
              indexColumnLabel={indexColumnLabel}
              removeColumnTooltip={removeColumnTooltip}
              onAppendColumn={onAppendColumn}
              onRemoveColumnByKey={onRemoveColumnByKey}
              onSetColumnHeader={onSetColumnHeader}
              isReadOnly={isReadOnly}
            />
          </TableHeader>

          <TableBody>
            {tableRows.map((row, rowIndex) => (
              <TableDataRow
                key={`row-${row.id}`}
                row={row}
                rowIndex={rowIndex}
                tableColumns={tableColumns}
                validation={validation}
                rowCellValidationSig={rowCellValidationSignature(row.id, tableColumns, validation)}
                locale={locale}
                showIndexColumn={showIndexColumn}
                cellInputPlaceholder={cellInputPlaceholder}
                removeRowTooltip={removeRowTooltip}
                onSetCellValue={onSetCellValue}
                onRemoveRowById={onRemoveRowById}
                onClickRow={onClickRow}
                isReadOnly={isReadOnly}
              />
            ))}

            {!tableRows.length && (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length + (showIndexColumn ? 1 : 0) + (isReadOnly ? 0 : 1)}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  {hasAnyColumn ? emptyNoRowsMessage : emptyNoColumnsMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {
        !isReadOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            className="inline-flex items-center gap-2 px-4"
            onClick={onAppendRow}
            disabled={!hasAnyColumn}
            aria-label={addRowButtonText}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            {addRowButtonText}
          </Button>
        </div>
        )
      }
    </div>
  );
}
