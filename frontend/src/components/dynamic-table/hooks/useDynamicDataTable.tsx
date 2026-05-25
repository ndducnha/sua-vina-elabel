import {
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type Row,
  type RowSelectionState,
  type SortingState,
  type Table,
} from "@tanstack/react-table";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { DynamicTableBatchActionBar } from "../components/DynamicTableBatchActionBar";
import { buildDynamicTableSelectColumn } from "../utils";

export type UseDynamicDataTableParams<TData> = {
  data: TData[];
  columns: ColumnDef<TData, unknown>[];
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  getRowId?: (originalRow: TData, index: number, parent?: unknown) => string;
  showCheckbox?: boolean;
  selectionToolbarActions?: ReactNode;
};

export type UseDynamicDataTableResult<TData> = {
  table: Table<TData>;
  tableColumns: ColumnDef<TData, unknown>[];
  rows: Row<TData>[];
  colCount: number;
  showRows: boolean;
  showSelectionToolbar: boolean;
  selectionToolbar: ReactNode;
};

export function useDynamicDataTable<TData>(
  params: UseDynamicDataTableParams<TData>
): UseDynamicDataTableResult<TData> {
  const { t } = useTranslation();
  const {
    data,
    columns,
    sorting,
    onSortingChange,
    rowSelection,
    onRowSelectionChange,
    getRowId,
    showCheckbox = false,
    selectionToolbarActions,
  } = params;

  const [internalRowSelection, setInternalRowSelection] = useState<RowSelectionState>({});

  const isCheckboxMode = Boolean(showCheckbox);
  const isCheckboxSelectionControlled =
    isCheckboxMode && rowSelection !== undefined && onRowSelectionChange !== undefined;

  useEffect(() => {
    if (isCheckboxMode && getRowId == null && import.meta.env.DEV) {
      // eslint-disable-next-line no-console -- explicit integration hint
      console.error(
        "DynamicDataTable: `showCheckbox` requires a `getRowId` callback for stable row ids."
      );
    }
  }, [isCheckboxMode, getRowId]);

  const hasRowSelection = isCheckboxMode || onRowSelectionChange != null;

  const finalRowSelection = isCheckboxMode
    ? isCheckboxSelectionControlled
      ? (rowSelection as RowSelectionState)
      : internalRowSelection
    : (rowSelection ?? {});

  const finalOnRowSelectionChange = isCheckboxMode
    ? isCheckboxSelectionControlled
      ? (onRowSelectionChange as OnChangeFn<RowSelectionState>)
      : setInternalRowSelection
    : onRowSelectionChange;

  const tableColumns = useMemo((): ColumnDef<TData, unknown>[] => {
    if (!isCheckboxMode) return columns;
    return [buildDynamicTableSelectColumn<TData>(), ...columns];
  }, [isCheckboxMode, columns]);

  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      ...(hasRowSelection ? { rowSelection: finalRowSelection } : {}),
    },
    onSortingChange,
    onRowSelectionChange: hasRowSelection ? finalOnRowSelectionChange : undefined,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    // Row selection enables TanStack client-side row models; without `manualPagination`, the table
    // can slice rows as if paginating client-side. Server-driven lists keep all rows in `data` and
    // paginate via API — this flag prevents that accidental row subset.
    manualPagination: isCheckboxMode,
    enableSortingRemoval: true,
    enableRowSelection: hasRowSelection,
    getRowId: getRowId ?? ((_, index) => String(index)),
  });

  const rows = table.getRowModel().rows;
  const showRows = rows.length > 0;
  const colCount = tableColumns.length;

  const selectedRowCount = useMemo(
    () => Object.values(finalRowSelection).filter(Boolean).length,
    [finalRowSelection]
  );

  const showSelectionToolbar = isCheckboxMode && selectedRowCount > 0;

  const selectionToolbar = showSelectionToolbar ? (
    <DynamicTableBatchActionBar
      selectedCount={selectedRowCount}
      summary={t("common.tableRowsSelected", { count: selectedRowCount })}
      actions={selectionToolbarActions ?? null}
    />
  ) : null;

  return {
    table,
    tableColumns,
    rows,
    colCount,
    showRows,
    showSelectionToolbar,
    selectionToolbar,
  };
}
