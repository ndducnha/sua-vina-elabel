import type { ReactNode } from "react";

import type { FieldValidationPhase } from "@/components/dynamic-form/types";

/** Public types, props, and table state for `ExpandableTable` (domain + hook + reducer). */
export const DEFAULT_COLUMN_BUTTON_TEXT = "+ Thêm cột";
export const DEFAULT_ROW_BUTTON_TEXT = "+ Thêm lô hàng";
export const DEFAULT_HEADER_PLACEHOLDER = "Nhập tên trường";
export const DEFAULT_CELL_PLACEHOLDER = "Nhập giá trị";

export type ExpandableTableCellInputType = "text" | "number" | "date";


export type ExpandableTableColumnValidatorArgs = {
  columnKey: string;
  rows: ReadonlyArray<{
    id: number;
    values: ExpandableTableRow;
  }>;
};

export type ExpandableTableColumnValidator = (
  args: ExpandableTableColumnValidatorArgs,
  context: unknown
) => boolean;

/** Per-cell phased feedback (e.g. traceability URL). Does not change input border; render message below the cell. */
export type ExpandableTableCellPhaseFeedback = {
  phase: FieldValidationPhase;
  message?: string;
};

export type ExpandableTableCellFeedbackResolver = (
  args: ExpandableTableColumnValidatorArgs,
  context: unknown
) => Map<string, ExpandableTableCellPhaseFeedback>;

export type ExpandableTableColumnConfig = {
  minWidth?: number;
  validator?: ExpandableTableColumnValidator;
  /** i18n key; resolved with `t` when the column validator fails. If omitted, uses table `validationMessages.columnInvalid`. */
  invalidMessageI18nKey?: string;
  /**
   * Optional per-cell messages by {@link cellErrorKey}. Used for multi-phase validation (warning / error text)
   * without applying destructive input styling — see {@link ExpandableTableCellPhaseFeedback}.
   */
  cellFeedbackResolver?: ExpandableTableCellFeedbackResolver;
};

/** Optional per-locale header labels; if omitted, `header` is shown for every language. */
export type ExpandableTableColumnHeaderTranslations = Partial<
  Record<"en" | "vi", string>
>;

export type ExpandableTableColumnInput = {
  key: string;
  header: string;
  headerTranslations?: ExpandableTableColumnHeaderTranslations;
  required?: boolean;
  /** When true, values must be unique across rows (non-empty, trim compared). */
  unique?: boolean;
  /** When true, column stays visible (sticky) on horizontal scroll. */
  permanent?: boolean;
  /** Cell input type; defaults to `"text"`. */
  inputType?: ExpandableTableCellInputType;
  /** i18n key for the cell `placeholder`. Takes precedence over {@link cellPlaceholder}. */
  cellPlaceholderI18nKey?: string;
  /** Literal placeholder (e.g. appendix: field name, same as `header`). */
  cellPlaceholder?: string;
  headerChipI18nKey?: string;
  disabled?: boolean;
  min?: number | string; //Native `min` for the cell input. `number`: numeric; `date`: `YYYY-MM-DD` or `"today"`.
  max?: number | string; //Native `max` for the cell input. Same shape as `min`.
  column?: ExpandableTableColumnConfig;
};

export type ExpandableTableColumn = {
  key: string;
  header: string;
  headerTranslations?: ExpandableTableColumnHeaderTranslations;
  required: boolean;
  unique: boolean;
  permanent: boolean;
  inputType: ExpandableTableCellInputType;
  cellPlaceholderI18nKey?: string;
  cellPlaceholder?: string;
  headerChipI18nKey?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  columnMinWidthPx?: number;
};

export type ExpandableTableRow = Record<string, string>;

export type ExpandableTableChangePayload = {
  columns: ExpandableTableColumn[];
  rows: ExpandableTableRow[];
};

export type ExpandableTableValidationMessages = {
  duplicateHeader?: string;
  required?: string;
  unique?: string;
  columnInvalid?: string;
};

export type ExpandableTableValidationResult = {
  isValid: boolean;
  duplicateHeaderKeys: ReadonlySet<string>;
  headerErrorByKey: Partial<Record<string, string>>;
  cellErrorByKey: ReadonlyMap<string, string>;
  columnErrorByKey: ReadonlyMap<string, string>;
  /** Inline under-cell copy; `phase === "error"` still blocks {@link isValid}. */
  cellPhaseFeedbackByKey: ReadonlyMap<string, ExpandableTableCellPhaseFeedback>;
};

export type ExpandableTableProps = {
  columns?: ExpandableTableColumnInput[];
  /** Controlled mode (optional). */
  rows?: ExpandableTableRow[];
  defaultColumns?: ExpandableTableColumnInput[];
  /** Uncontrolled initial rows. */
  defaultRows?: ExpandableTableRow[];
  onChange?: (payload: ExpandableTableChangePayload) => void;
  showIndexColumn?: boolean;
  addColumnButtonText?: string;
  addRowButtonText?: string;
  headerInputPlaceholder?: string;
  cellInputPlaceholder?: string;
  emptyNoRowsMessage?: string;
  emptyNoColumnsMessage?: string;
  requireColumnHeaderByDefault?: boolean;
  className?: string;
  validationMessages?: ExpandableTableValidationMessages;
  isReadOnly?: boolean;
  onValidationChange?: (result: ExpandableTableValidationResult) => void;
  cellValidationContext?: unknown;
  tableTitle?: ReactNode;
  onClickRow?: (row: any) => void;
};

export type InternalColumn = ExpandableTableColumn & {
  removable: boolean;
  columnInvalidMessageI18nKey?: string;
  columnValidator?: ExpandableTableColumnValidator;
  cellFeedbackResolver?: ExpandableTableCellFeedbackResolver;
};

export type InternalRow = {
  id: number;
  values: ExpandableTableRow;
  removable: boolean;
};

export type ExpandableTableState = {
  tableColumns: InternalColumn[];
  rowsById: Record<number, InternalRow>;
  rowOrder: number[];
  rowCursor: number;
  changeVersion: number;
  columnsSignature: string;
  rowsSignature: string;
};

export const ExpandableTableActionType = {
  ApplyExternalColumns: "applyExternalColumns",
  ApplyExternalRows: "applyExternalRows",
  AppendColumn: "appendColumn",
  RemoveColumnByKey: "removeColumnByKey",
  AppendRow: "appendRow",
  RemoveRowById: "removeRowById",
  SetColumnHeader: "setColumnHeader",
  SetCellValue: "setCellValue",
  ResetAllTableData: "resetAllTableData",
  RemoveAllRemovableColumns: "removeAllRemovableColumns",
  RemoveAllRemovableRows: "removeAllRemovableRows",
} as const;

export type ExpandableTableAction =
  | {
      type: typeof ExpandableTableActionType.ApplyExternalColumns;
      payload: { columns: InternalColumn[] };
    }
  | {
      type: typeof ExpandableTableActionType.ApplyExternalRows;
      payload: { rows: InternalRow[] };
    }
  | {
      type: typeof ExpandableTableActionType.AppendColumn;
      payload: { requiredByDefault: boolean };
    }
  | {
      type: typeof ExpandableTableActionType.RemoveColumnByKey;
      payload: { columnKey: string };
    }
  | { type: typeof ExpandableTableActionType.AppendRow }
  | {
      type: typeof ExpandableTableActionType.RemoveRowById;
      payload: { rowId: number };
    }
  | {
      type: typeof ExpandableTableActionType.SetColumnHeader;
      payload: { columnKey: string; headerValue: string };
    }
  | {
      type: typeof ExpandableTableActionType.SetCellValue;
      payload: { rowId: number; columnKey: string; value: string };
    }
  | { type: typeof ExpandableTableActionType.ResetAllTableData }
  | { type: typeof ExpandableTableActionType.RemoveAllRemovableColumns }
  | { type: typeof ExpandableTableActionType.RemoveAllRemovableRows };
