import type {
  ExpandableTableChangePayload,
  ExpandableTableColumn,
  ExpandableTableColumnInput,
  ExpandableTableRow,
  InternalColumn,
  InternalRow,
} from "../types";

/** User-appended columns in the table UI use this prefix. */
export const EXTRA_COLUMN_PREFIX = "extraColumn";

function assertInputColumnKey(key: string | undefined, index: number): string {
  if (key == null || String(key).trim() === "") {
    throw new Error(
      `ExpandableTable: column at index ${index} is missing a non-empty "key". Parent must supply keys for all columns; only columns added via the table UI use auto-generated "extraColumnN" keys.`
    );
  }
  return String(key);
}

export function toInternalColumns(
  columns: ExpandableTableColumnInput[],
  requireByDefault: boolean,
  defaultColumnKeys?: Set<string>
): InternalColumn[] {
  return columns.map((column, index) => {
    const key = assertInputColumnKey(column.key, index);
    const isDefault = defaultColumnKeys?.has(key) ?? false;
    const c = column.column;
    return {
      key,
      header: column.header,
      headerTranslations: column.headerTranslations,
      required: column.required ?? requireByDefault,
      unique: column.unique ?? false,
      permanent: column.permanent ?? false,
      inputType: column.inputType ?? "text",
      cellPlaceholderI18nKey: column.cellPlaceholderI18nKey,
      cellPlaceholder: column.cellPlaceholder,
      headerChipI18nKey: column.headerChipI18nKey,
      disabled: column.disabled,
      min: column.min,
      max: column.max,
      columnMinWidthPx: c?.minWidth,
      columnInvalidMessageI18nKey: c?.invalidMessageI18nKey,
      columnValidator: c?.validator,
      cellFeedbackResolver: c?.cellFeedbackResolver,
      removable: !isDefault,
    };
  });
}

export function toInternalRows(
  rows: ExpandableTableRow[],
  defaultRowIds?: Set<number>
): InternalRow[] {
  return rows.map((row, index) => ({
    id: index + 1,
    values: { ...row },
    removable: !(defaultRowIds?.has(index + 1) ?? false),
  }));
}

export function normalizeRows(columns: InternalColumn[], rows: InternalRow[]): InternalRow[] {
  return rows.map((row) => {
    const nextValues: ExpandableTableRow = {};
    columns.forEach((column) => {
      nextValues[column.key] = row.values[column.key] ?? "";
    });
    return { ...row, values: nextValues };
  });
}

export function toRowsState(rows: InternalRow[]): {
  rowsById: Record<number, InternalRow>;
  rowOrder: number[];
} {
  const rowsById: Record<number, InternalRow> = {};
  const rowOrder: number[] = [];
  for (const row of rows) {
    rowsById[row.id] = row;
    rowOrder.push(row.id);
  }
  return { rowsById, rowOrder };
}

export function orderedRows(
  rowsById: Record<number, InternalRow>,
  rowOrder: number[]
): InternalRow[] {
  return rowOrder.map((id) => rowsById[id]);
}

export function nextRowCursor(rowOrder: number[]): number {
  return rowOrder.length === 0 ? 1 : Math.max(...rowOrder) + 1;
}

const EXTRA_COLUMN_RE = /^extraColumn(\d+)$/;

/** Next 1-based index for a new `extraColumnN` key (scans only `extraColumn*`). */
export function nextExtraColumnIndex(columns: ReadonlyArray<{ key: string }>): number {
  const indices: number[] = [];
  for (const column of columns) {
    const m = EXTRA_COLUMN_RE.exec(column.key);
    if (m) {
      const n = Number.parseInt(m[1], 10);
      if (Number.isFinite(n)) indices.push(n);
    }
  }
  return indices.length > 0 ? Math.max(...indices) + 1 : 1;
}

/** One exported row: one key per current column (missing / lazy keys → ""). */
export function expandRowValuesToColumns(
  columns: InternalColumn[],
  values: ExpandableTableRow
): ExpandableTableRow {
  const out: ExpandableTableRow = {};
  columns.forEach((column) => {
    out[column.key] = values[column.key] ?? "";
  });
  return out;
}

function toPublicColumn(c: InternalColumn): ExpandableTableColumn {
  const { removable, columnInvalidMessageI18nKey, columnValidator, ...pub } = c;
  void removable;
  void columnInvalidMessageI18nKey;
  void columnValidator;
  return pub;
}

export function toPublicPayload(
  columns: InternalColumn[],
  rows: InternalRow[]
): ExpandableTableChangePayload {
  return {
    columns: columns.map(toPublicColumn),
    rows: rows.map((row) => expandRowValuesToColumns(columns, row.values)),
  };
}

export function toPublicPayloadFromRowsState(
  columns: InternalColumn[],
  rowsById: Record<number, InternalRow>,
  rowOrder: number[]
): ExpandableTableChangePayload {
  return toPublicPayload(columns, orderedRows(rowsById, rowOrder));
}

export function columnsSignature(columns: InternalColumn[]): string {
  return columns
    .map(
      (column) =>
        `${column.key}::${column.header}::${column.headerTranslations ? JSON.stringify(column.headerTranslations) : ""}::${column.required ? 1 : 0}::${column.removable ? 1 : 0}::${column.permanent ? 1 : 0}::${column.unique ? 1 : 0}::${column.inputType}::${column.cellPlaceholderI18nKey ?? ""}::ph:${column.cellPlaceholder ?? ""}::${column.headerChipI18nKey ?? ""}::${column.disabled ? 1 : 0}::min:${String(column.min ?? "")}::max:${String(column.max ?? "")}::colMinW:${String(column.columnMinWidthPx ?? "")}`
    )
    .join("|");
}

/** Stable row fingerprint: follows `tableColumns` order (supports lazy row.values). */
export function rowsSignature(
  tableColumns: InternalColumn[],
  rowsById: Record<number, InternalRow>,
  rowOrder: number[]
): string {
  return rowOrder
    .map((id) => {
      const row = rowsById[id];
      const valuesSig = tableColumns
        .map((col) => `${col.key}:${row.values[col.key] ?? ""}`)
        .join(",");
      return `${row.id}::${row.removable ? 1 : 0}::${valuesSig}`;
    })
    .join("|");
}
