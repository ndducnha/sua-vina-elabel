import {
  flexRender,
  type Cell,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { memo, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router";

import { useDynamicDataTable } from "../hooks/useDynamicDataTable";
import type { DynamicTableColumnMeta } from "../types";
import { DynamicDataTableMobileCard } from "./responsive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DynamicDataTableBaseProps<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  /** Managed row selection (optional with `showCheckbox`: lifts state to the parent; omit to keep selection only inside the table). */
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /** Required when `showCheckbox` is true. */
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string;
  isLoading?: boolean;
  loadingLabel?: string;
  emptyLabel: string;
  className?: string;
  scrollContainerClassName?: string;
  showCheckbox?: boolean;
  selectionToolbarActions?: ReactNode;
};

export type DynamicDataTableProps<TData> = DynamicDataTableBaseProps<TData>;

type DataTableBodyRowProps<TData> = {
  row: Row<TData>;
  isSelected: boolean;
  /** Column defs identity: when headers/cells change (e.g. i18n), rows must re-render. */
  columns: ColumnDef<TData, unknown>[];
};

function getColumnMeta<TData>(cell: Cell<TData, unknown>): DynamicTableColumnMeta<TData> {
  return (cell.column.columnDef.meta ?? {}) as DynamicTableColumnMeta<TData>;
}

function stickyInsetStyle<T>(meta: DynamicTableColumnMeta<T>): CSSProperties | undefined {
  if (meta.sticky === "right") {
    return { right: meta.stickyOffset?.trim() || "0px" };
  }
  if (meta.sticky === "left") {
    return { left: meta.stickyOffset?.trim() || "0px" };
  }
  return undefined;
}

function stickyHorizontalZ<T>(meta: DynamicTableColumnMeta<T>, layer: "body" | "head"): string | undefined {
  if (meta.sticky !== "right" && meta.sticky !== "left") return undefined;
  const raw = meta.stickyOffset?.trim();
  const innerBand = Boolean(raw && raw !== "0" && raw !== "0px");
  if (layer === "body") {
    return innerBand ? "z-[11]" : "z-[12]";
  }
  return innerBand ? "z-[31]" : "z-[32]";
}

function renderBodyCellContent<TData>(cell: Cell<TData, unknown>) {
  const meta = getColumnMeta(cell);
  const inner = flexRender(cell.column.columnDef.cell, cell.getContext());
  const to = meta.linkToRow?.(cell.row.original);
  if (to) {
    return (
      <Link
        to={to}
        state={meta.linkState?.(cell.row.original)}
        className={cn("min-w-0", meta.linkClassName)}
        onClick={(e) => e.stopPropagation()}
      >
        {inner}
      </Link>
    );
  }
  return inner;
}

function DataTableBodyRowInner<TData>({ row, isSelected }: DataTableBodyRowProps<TData>) {
  return (
    <TableRow
      data-state={isSelected && "selected"}
      className="group"
    >
      {row.getVisibleCells().map((cell) => {
        const meta = getColumnMeta(cell);
        const stickyRight = meta.sticky === "right";
        const stickyLeft = meta.sticky === "left";
        return (
          <TableCell
            key={cell.id}
            style={stickyInsetStyle(meta)}
            className={cn(
              stickyRight &&
                cn(
                  "sticky border-l border-border bg-card",
                  stickyHorizontalZ(meta, "body"),
                ),
              stickyLeft &&
                cn(
                  "sticky border-r border-border bg-card",
                  stickyHorizontalZ(meta, "body"),
                ),
            )}
          >
            <div
              className="line-clamp-2 break-all"
              title={typeof cell.getValue() === "string" || typeof cell.getValue() === "number" ? String(cell.getValue()) : undefined}
            >
              {renderBodyCellContent(cell)}
            </div>
          </TableCell>
        );
      })}
    </TableRow>
  );
}

function dataTableBodyRowPropsAreEqual<TData>(
  prev: DataTableBodyRowProps<TData>,
  next: DataTableBodyRowProps<TData>
): boolean {
  if (prev.columns !== next.columns) return false;
  if (prev.row.id !== next.row.id) return false;
  if (prev.row.original !== next.row.original) return false;
  if (prev.isSelected !== next.isSelected) return false;
  return true;
}

const DataTableBodyRow = memo(
  DataTableBodyRowInner,
  dataTableBodyRowPropsAreEqual
) as typeof DataTableBodyRowInner;

/** Viewport height shared by desktop table + mobile card stack (<md cards, md+ table). */
const scrollShell = (extra: string, scrollContainerClassName?: string) =>
  cn(
    "min-h-0 w-full overflow-auto",
    "h-[min(60vh,calc(100svh-12rem))]",
    extra,
    scrollContainerClassName
  );

export function DynamicDataTable<TData>({
  data,
  columns,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  getRowId,
  isLoading,
  loadingLabel,
  emptyLabel,
  className,
  scrollContainerClassName,
  showCheckbox = false,
  selectionToolbarActions,
}: DynamicDataTableProps<TData>) {
  const {
    table,
    tableColumns,
    rows,
    colCount,
    showRows,
    showSelectionToolbar,
    selectionToolbar,
  } = useDynamicDataTable({
    data,
    columns,
    sorting,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    getRowId,
    showCheckbox,
    selectionToolbarActions,
  });

  return (
    <div className={cn("flex min-h-0 w-full flex-col gap-2", showSelectionToolbar && "gap-3")}>
      {selectionToolbar ? (
        <div className="w-full shrink-0" data-slot="dynamic-data-table-selection-toolbar">
          {selectionToolbar}
        </div>
      ) : null}
      {/* md+: classic table */}
      <div
        data-slot="dynamic-data-table-desktop"
        className={scrollShell("hidden md:block", scrollContainerClassName)}
      >
        <Table noWrapper className={cn(className)}>
          <TableHeader className="sticky top-0 z-20 border-b border-border bg-muted">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-0 hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sorted = header.column.getIsSorted();
                  const meta = (header.column.columnDef.meta ?? {}) as DynamicTableColumnMeta<unknown>;
                  const stickyRight = meta.sticky === "right";
                  const stickyLeft = meta.sticky === "left";
                  return (
                    <TableHead
                      key={header.id}
                      style={stickyInsetStyle(meta)}
                      className={cn(
                        canSort && "cursor-pointer select-none",
                        stickyRight &&
                          cn(
                            "sticky border-l border-border bg-muted shadow-[inset_4px_0_6px_-4px_rgba(0,0,0,0.06)]",
                            stickyHorizontalZ(meta, "head"),
                          ),
                        stickyLeft &&
                          cn(
                            "sticky border-r border-border bg-muted shadow-[inset_-4px_0_6px_-4px_rgba(0,0,0,0.06)]",
                            stickyHorizontalZ(meta, "head"),
                          ),
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {canSort ? (
                          <span className="text-muted-foreground">
                            {sorted === "asc" ? (
                              <ArrowUp className="size-3.5" />
                            ) : sorted === "desc" ? (
                              <ArrowDown className="size-3.5" />
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-50" />
                            )}
                          </span>
                        ) : null}
                      </div>
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {loadingLabel ?? "…"}
                </TableCell>
              </TableRow>
            ) : showRows ? (
              rows.map((row) => (
                <DataTableBodyRow
                  key={row.id}
                  row={row}
                  isSelected={row.getIsSelected()}
                  columns={tableColumns}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={colCount} className="h-24 text-center text-muted-foreground">
                  {emptyLabel}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* <md: one card per row */}
      <div
        data-slot="dynamic-data-table-mobile"
        className={scrollShell("flex flex-col gap-3 md:hidden", scrollContainerClassName)}
      >
        {isLoading && data.length === 0 ? (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
            {loadingLabel ?? "…"}
          </div>
        ) : showRows ? (
          rows.map((row) => (
            <DynamicDataTableMobileCard
              key={row.id}
              table={table}
              row={row}
              isSelected={row.getIsSelected()}
            />
          ))
        ) : (
          <div className="flex min-h-24 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  );
}
