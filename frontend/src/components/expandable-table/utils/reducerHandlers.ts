import {
  columnsSignature,
  EXTRA_COLUMN_PREFIX,
  nextExtraColumnIndex,
  nextRowCursor,
  normalizeRows,
  rowsSignature,
  toRowsState,
} from "./mappers";
import type { ExpandableTableRow, ExpandableTableState, InternalColumn, InternalRow } from "../types";

export type CreateStateOptions = {
  /**
   * When `tableColumns` is unchanged (or already reflected in a precomputed string),
   * pass the previous `columnsSignature` to skip re-stringifying the full column list.
   */
  reuseColumnsSignatureFrom?: string;
};

export function createState(
  tableColumns: InternalColumn[],
  rowsById: ExpandableTableState["rowsById"],
  rowOrder: ExpandableTableState["rowOrder"],
  rowCursor: number,
  changeVersion = 0,
  options?: CreateStateOptions
): ExpandableTableState {
  const columnsSig =
    options?.reuseColumnsSignatureFrom !== undefined
      ? options.reuseColumnsSignatureFrom
      : columnsSignature(tableColumns);
  return {
    tableColumns,
    rowsById,
    rowOrder,
    rowCursor,
    changeVersion,
    columnsSignature: columnsSig,
    rowsSignature: rowsSignature(tableColumns, rowsById, rowOrder),
  };
}

/** Controlled `columns` prop merged in (rebuilds row value keys for new schema). */
export function applyExternalColumnsReducer(
  state: ExpandableTableState,
  nextColumns: InternalColumn[]
): ExpandableTableState {
  const nextColumnsSig = columnsSignature(nextColumns);
  if (nextColumnsSig === state.columnsSignature) {
    return state;
  }

  const ordered = state.rowOrder.map((id) => state.rowsById[id]);
  const normalized = normalizeRows(nextColumns, ordered);
  const { rowsById: nextById, rowOrder: nextOrder } = toRowsState(normalized);
  return createState(nextColumns, nextById, nextOrder, state.rowCursor, state.changeVersion, {
    reuseColumnsSignatureFrom: nextColumnsSig,
  });
}

/** Controlled `rows` prop merged in. */
export function applyExternalRowsReducer(
  state: ExpandableTableState,
  rows: InternalRow[]
): ExpandableTableState {
  const normalized = normalizeRows(state.tableColumns, rows);
  const { rowsById: nextById, rowOrder: nextOrder } = toRowsState(normalized);
  const nextRowsSig = rowsSignature(state.tableColumns, nextById, nextOrder);
  if (nextRowsSig === state.rowsSignature) return state;

  return createState(
    state.tableColumns,
    nextById,
    nextOrder,
    nextRowCursor(nextOrder),
    state.changeVersion,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}

/** User / UI: append one empty column (lazy cell keys). */
export function appendColumnReducer(
  state: ExpandableTableState,
  requiredByDefault: boolean
): ExpandableTableState {
  const n = nextExtraColumnIndex(state.tableColumns);
  const newColumn: InternalColumn = {
    key: `${EXTRA_COLUMN_PREFIX}${n}`,
    header: "",
    required: requiredByDefault,
    unique: false,
    permanent: false,
    inputType: "text",
    removable: true,
  };
  const nextColumns = [...state.tableColumns, newColumn];
  return createState(
    nextColumns,
    state.rowsById,
    state.rowOrder,
    state.rowCursor,
    state.changeVersion + 1
  );
}

/** User / UI: remove column and strip that key from rows that had it. */
export function removeColumnByKeyReducer(
  state: ExpandableTableState,
  columnKey: string
): ExpandableTableState {
  const target = state.tableColumns.find((column) => column.key === columnKey);
  if (!target || !target.removable) return state;

  const nextColumns = state.tableColumns.filter((column) => column.key !== columnKey);
  let nextRowsById = state.rowsById;
  let copied = false;

  for (const id of state.rowOrder) {
    const row = (copied ? nextRowsById : state.rowsById)[id];
    if (!(columnKey in row.values)) continue;
    if (!copied) {
      nextRowsById = { ...state.rowsById };
      copied = true;
    }
    const nextValues = { ...row.values };
    delete nextValues[columnKey];
    nextRowsById[id] = { ...row, values: nextValues };
  }

  return createState(
    nextColumns,
    nextRowsById,
    state.rowOrder,
    state.rowCursor,
    state.changeVersion + 1
  );
}

/** User / UI: append one empty row. */
export function appendRowReducer(state: ExpandableTableState): ExpandableTableState {
  const id = state.rowCursor;
  const newRow: InternalRow = {
    id,
    values: {},
    removable: true,
  };
  return createState(
    state.tableColumns,
    { ...state.rowsById, [id]: newRow },
    [...state.rowOrder, id],
    state.rowCursor + 1,
    state.changeVersion + 1,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}

/** User / UI: remove row if removable. */
export function removeRowByIdReducer(state: ExpandableTableState, rowId: number): ExpandableTableState {
  const target = state.rowsById[rowId];
  if (!target?.removable) return state;
  const nextOrder = state.rowOrder.filter((id) => id !== rowId);
  if (nextOrder.length === state.rowOrder.length) return state;
  const { [rowId]: _removed, ...nextById } = state.rowsById;
  void _removed;
  return createState(
    state.tableColumns,
    nextById,
    nextOrder,
    state.rowCursor,
    state.changeVersion + 1,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}

/** User / UI: rename a removable column header. */
export function setColumnHeaderReducer(
  state: ExpandableTableState,
  columnKey: string,
  headerValue: string
): ExpandableTableState {
  let changed = false;
  const nextColumns = state.tableColumns.map((column) => {
    if (column.key !== columnKey) return column;
    if (!column.removable) return column;
    if (column.header === headerValue) return column;
    changed = true;
    return { ...column, header: headerValue };
  });
  if (!changed) return state;
  return createState(
    nextColumns,
    state.rowsById,
    state.rowOrder,
    state.rowCursor,
    state.changeVersion + 1
  );
}

/** User / UI: edit one cell. */
export function setCellValueReducer(
  state: ExpandableTableState,
  rowId: number,
  columnKey: string,
  value: string
): ExpandableTableState {
  const row = state.rowsById[rowId];
  if (!row) return state;
  const prev = row.values[columnKey];
  if ((prev ?? "") === value) return state;
  return createState(
    state.tableColumns,
    {
      ...state.rowsById,
      [rowId]: {
        ...row,
        values: { ...row.values, [columnKey]: value },
      },
    },
    state.rowOrder,
    state.rowCursor,
    state.changeVersion + 1,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}

/** Clear all cell values; empty headers of removable (user-added) columns. */
export function resetAllTableDataReducer(state: ExpandableTableState): ExpandableTableState {
  if (!state.tableColumns.length) return state;

  const anyCellNonEmpty = state.rowOrder.some((id) =>
    state.tableColumns.some(
      (col) => (state.rowsById[id].values[col.key] ?? "") !== ""
    )
  );
  const anyRemovableHeader = state.tableColumns.some(
    (c) => c.removable && c.header !== ""
  );
  if (!anyCellNonEmpty && !anyRemovableHeader) return state;

  const nextColumns = state.tableColumns.map((column) => {
    if (!column.removable) return column;
    if (column.header === "") return column;
    return { ...column, header: "" };
  });

  const nextRowsById: Record<number, InternalRow> = { ...state.rowsById };
  for (const id of state.rowOrder) {
    const row = state.rowsById[id];
    const nextValues: ExpandableTableRow = {};
    for (const col of state.tableColumns) {
      nextValues[col.key] = "";
    }
    nextRowsById[id] = { ...row, values: nextValues };
  }

  return createState(
    nextColumns,
    nextRowsById,
    state.rowOrder,
    state.rowCursor,
    state.changeVersion + 1,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}

/** Remove every user-appended column (`removable: true`); default columns stay. */
export function removeAllRemovableColumnsReducer(
  state: ExpandableTableState
): ExpandableTableState {
  const nextColumns = state.tableColumns.filter((column) => !column.removable);
  if (nextColumns.length === state.tableColumns.length) return state;

  const ordered = state.rowOrder.map((id) => state.rowsById[id]);
  const normalized = normalizeRows(nextColumns, ordered);
  const { rowsById: nextById, rowOrder: nextOrder } = toRowsState(normalized);

  return createState(
    nextColumns,
    nextById,
    nextOrder,
    state.rowCursor,
    state.changeVersion + 1
  );
}

/** Remove every user-appended row (`removable: true`); default rows stay. */
export function removeAllRemovableRowsReducer(state: ExpandableTableState): ExpandableTableState {
  const nextOrder = state.rowOrder.filter((id) => !state.rowsById[id].removable);
  if (nextOrder.length === state.rowOrder.length) return state;

  const nextById: Record<number, InternalRow> = {};
  for (const id of nextOrder) {
    nextById[id] = state.rowsById[id];
  }

  const newRowCursor = Math.max(state.rowCursor, nextRowCursor(nextOrder));

  return createState(
    state.tableColumns,
    nextById,
    nextOrder,
    newRowCursor,
    state.changeVersion + 1,
    { reuseColumnsSignatureFrom: state.columnsSignature }
  );
}
