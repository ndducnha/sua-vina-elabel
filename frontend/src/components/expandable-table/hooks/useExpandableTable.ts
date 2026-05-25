import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import { messageDialogService } from "@/components/dialog/messageDialog";
import { ExpandableTableActionType, type ExpandableTableProps } from "../types";
import { computeExpandableTableValidation } from "../utils/expandableTableValidation";
import {
  nextRowCursor,
  normalizeRows,
  orderedRows,
  toInternalColumns,
  toInternalRows,
  toPublicPayloadFromRowsState,
  toRowsState,
} from "../utils/mappers";
import { createState, expandableTableReducer } from "../reducer";

/**
 * Stable function identity; always calls the latest `fn` (same idea as React's useEffectEvent).
 */
function useEffectEvent<T extends (...args: never[]) => unknown>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;
  return useCallback(((...args: never[]) => ref.current(...args)) as T, []);
}

const EXPANDABLE_TABLE_CONFIRM_I18N = {
  deleteColumn: {
    title: "expandableTable.deleteColumnDialogTitle",
    message: "expandableTable.deleteColumnDialogMessage",
    confirm: "expandableTable.deleteColumnDialogConfirm",
  },
  deleteRow: {
    title: "expandableTable.deleteRowDialogTitle",
    message: "expandableTable.deleteRowDialogMessage",
    confirm: "expandableTable.deleteRowDialogConfirm",
  },
  resetAllData: {
    title: "expandableTable.resetAllDataDialogTitle",
    message: "expandableTable.resetAllDataDialogMessage",
    confirm: "expandableTable.resetAllDataDialogConfirm",
  },
  resetAllColumns: {
    title: "expandableTable.resetAllColumnsDialogTitle",
    message: "expandableTable.resetAllColumnsDialogMessage",
    confirm: "expandableTable.resetAllColumnsDialogConfirm",
  },
  resetAllRows: {
    title: "expandableTable.resetAllRowsDialogTitle",
    message: "expandableTable.resetAllRowsDialogMessage",
    confirm: "expandableTable.resetAllRowsDialogConfirm",
  },
} as const;

type ExpandableTableConfirmKind = keyof typeof EXPANDABLE_TABLE_CONFIRM_I18N;

function openDeleteConfirmDialog(
  t: TFunction,
  i18n: { title: string; message: string; confirm: string },
  onSubmit: () => void
) {
  messageDialogService.open({
    context: "warning",
    title: t(i18n.title),
    message: t(i18n.message),
    cancelText: t("common.cancel"),
    confirmButton: { text: t(i18n.confirm), onSubmit },
  });
}

function openExpandableTableConfirm(
  t: TFunction,
  kind: ExpandableTableConfirmKind,
  onSubmit: () => void
) {
  openDeleteConfirmDialog(t, EXPANDABLE_TABLE_CONFIRM_I18N[kind], onSubmit);
}

export function useExpandableTable({
  columns,
  rows,
  onChange,
  defaultColumns = [],
  defaultRows = [],
  requireColumnHeaderByDefault = false,
  validationMessages,
  onValidationChange,
  cellValidationContext,
}: ExpandableTableProps) {
  const { t } = useTranslation();
  const isColumnsControlled = Array.isArray(columns);
  const isRowsControlled = Array.isArray(rows);

  const immutableColumnKeySet = useMemo(() => {
    const set = new Set<string>();
    for (const column of defaultColumns) {
      set.add(column.key);
    }
    return set;
  }, [defaultColumns]);

  /** Ids 1..N treated as default rows; only the length of `defaultRows` is tracked (data-only updates with same count keep the same set). */
  const defaultRowIdSet = useMemo(
    () => new Set(Array.from({ length: defaultRows.length }, (_, index) => index + 1)),
    [defaultRows.length]
  );

  const initialInternalColumns = toInternalColumns(
    defaultColumns,
    requireColumnHeaderByDefault,
    immutableColumnKeySet
  );
  const initialInternalRows = normalizeRows(
    initialInternalColumns,
    toInternalRows(defaultRows, defaultRowIdSet)
  );
  const { rowsById: initialRowsById, rowOrder: initialRowOrder } =
    toRowsState(initialInternalRows);

  const [state, dispatch] = useReducer(
    expandableTableReducer,
    createState(
      initialInternalColumns,
      initialRowsById,
      initialRowOrder,
      nextRowCursor(initialRowOrder)
    )
  );

  const { tableColumns, rowsById, rowOrder, changeVersion } = state;
  const tableRows = useMemo(() => orderedRows(rowsById, rowOrder), [rowsById, rowOrder]);
  const columnKeysSignature = useMemo(
    () => tableColumns.map((c) => c.key).join("|"),
    [tableColumns]
  );

  const baseValidation = useMemo(
    () =>
      computeExpandableTableValidation(
        tableColumns,
        tableRows,
        validationMessages,
        cellValidationContext
      ),
    [tableColumns, tableRows, validationMessages, cellValidationContext]
  );

  const validation = useMemo(() => {
    const columnErrorByKey = new Map(baseValidation.columnErrorByKey);
    for (const col of tableColumns) {
      const i18nKey = col.columnInvalidMessageI18nKey?.trim();
      if (!i18nKey) continue;
      if (columnErrorByKey.get(col.key) === i18nKey) {
        columnErrorByKey.set(col.key, t(i18nKey));
      }
    }
    return { ...baseValidation, columnErrorByKey };
  }, [baseValidation, tableColumns, t]);

  const notifyValidation = useEffectEvent(() => {
    onValidationChange?.(validation);
  });

  useEffect(() => {
    notifyValidation();
  }, [validation]);

  const notifyParentOfTableChange = useEffectEvent(() => {
    onChange?.(toPublicPayloadFromRowsState(tableColumns, rowsById, rowOrder));
  });

  useEffect(() => {
    notifyParentOfTableChange();
  }, [changeVersion]);

  useEffect(() => {
    if (!isColumnsControlled) return;
    const syncedColumns = toInternalColumns(
      columns,
      requireColumnHeaderByDefault,
      immutableColumnKeySet
    );
    dispatch({
      type: ExpandableTableActionType.ApplyExternalColumns,
      payload: { columns: syncedColumns },
    });
  }, [columns, isColumnsControlled, requireColumnHeaderByDefault, immutableColumnKeySet]);

  useEffect(() => {
    if (!isRowsControlled) return;
    const syncedRows = normalizeRows(
      tableColumns,
      toInternalRows(rows, defaultRowIdSet)
    );
    dispatch({
      type: ExpandableTableActionType.ApplyExternalRows,
      payload: { rows: syncedRows },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `columnKeysSignature` encodes column identity; including `tableColumns` can over-sync controlled rows
  }, [rows, isRowsControlled, columnKeysSignature, defaultRowIdSet]);

  const hasAnyColumn = tableColumns.length > 0;

  const appendColumn = useCallback(() => {
    dispatch({
      type: ExpandableTableActionType.AppendColumn,
      payload: { requiredByDefault: requireColumnHeaderByDefault },
    });
  }, [requireColumnHeaderByDefault]);

  const removeColumnByKey = useCallback(
    (columnKey: string) => {
      openExpandableTableConfirm(t, "deleteColumn", () => {
        dispatch({
          type: ExpandableTableActionType.RemoveColumnByKey,
          payload: { columnKey },
        });
      });
    },
    [t]
  );

  const appendRow = useCallback(() => {
    dispatch({ type: ExpandableTableActionType.AppendRow });
  }, []);

  const removeRowById = useCallback(
    (rowId: number) => {
      openExpandableTableConfirm(t, "deleteRow", () => {
        dispatch({
          type: ExpandableTableActionType.RemoveRowById,
          payload: { rowId },
        });
      });
    },
    [t]
  );

  const setColumnHeader = useCallback(
    (columnKey: string, headerValue: string) => {
      dispatch({
        type: ExpandableTableActionType.SetColumnHeader,
        payload: { columnKey, headerValue },
      });
    },
    []
  );

  const setCellValue = useCallback(
    (rowId: number, columnKey: string, value: string) => {
      dispatch({
        type: ExpandableTableActionType.SetCellValue,
        payload: { rowId, columnKey, value },
      });
    },
    []
  );

  const resetAllTableData = useCallback(() => {
    openExpandableTableConfirm(t, "resetAllData", () => {
      dispatch({ type: ExpandableTableActionType.ResetAllTableData });
    });
  }, [t]);

  const resetAllAddedColumns = useCallback(() => {
    openExpandableTableConfirm(t, "resetAllColumns", () => {
      dispatch({ type: ExpandableTableActionType.RemoveAllRemovableColumns });
    });
  }, [t]);

  const resetAllAddedRows = useCallback(() => {
    openExpandableTableConfirm(t, "resetAllRows", () => {
      dispatch({ type: ExpandableTableActionType.RemoveAllRemovableRows });
    });
  }, [t]);

  return {
    tableColumns,
    tableRows,
    validation,
    isValid: validation.isValid,
    appendColumn,
    removeColumnByKey,
    appendRow,
    removeRowById,
    setColumnHeader,
    setCellValue,
    hasAnyColumn,
    resetAllTableData,
    resetAllAddedColumns,
    resetAllAddedRows,
  };
}
