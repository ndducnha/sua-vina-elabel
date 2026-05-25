/** View-layer props for `components/ExpandableTable.tsx` (strings + handlers; i18n for labels in view where fixed). */
import type { ReactNode } from "react";
import type {
  ExpandableTableProps,
  ExpandableTableValidationResult,
  InternalColumn,
  InternalRow,
} from "../types";

export type ExpandableTableViewProps = {
  tableColumns: InternalColumn[];
  tableRows: InternalRow[];
  validation: ExpandableTableValidationResult;
  locale: string;
  hasAnyColumn: boolean;
  showIndexColumn: boolean;
  addColumnButtonText: string;
  addRowButtonText: string;
  headerInputPlaceholder: string;
  cellInputPlaceholder: string;
  emptyNoRowsMessage: string;
  emptyNoColumnsMessage: string;
  indexColumnLabel: string;
  removeColumnTooltip: string;
  removeRowTooltip: string;
  className?: ExpandableTableProps["className"];
  isReadOnly?: boolean;
  onAppendColumn: () => void;
  onRemoveColumnByKey: (columnKey: string) => void;
  onAppendRow: () => void;
  onRemoveRowById: (rowId: number) => void;
  onSetColumnHeader: (columnKey: string, headerValue: string) => void;
  onSetCellValue: (rowId: number, columnKey: string, value: string) => void;
  onResetAllTableData: () => void;
  onResetAllAddedColumns: () => void;
  onResetAllAddedRows: () => void;
  onClickRow?: (row: InternalRow) => void;
  tableTitle?: ReactNode;
};
