import { FIELD_VALIDATION_PHASE } from "@/components/dynamic-form/types";

import type {
  ExpandableTableCellPhaseFeedback,
  ExpandableTableValidationMessages,
  ExpandableTableValidationResult,
  InternalColumn,
  InternalRow,
} from "../types";

export const DEFAULT_VALIDATION_MESSAGES = {
  duplicateHeader: "Column names must be unique",
  required: "This field is required",
  unique: "Values must be unique in this column",
  columnInvalid: "Invalid value",
} as const;

export function cellErrorKey(
  rowId: number,
  columnKey: string
): string {
  return `${rowId}:${columnKey}`;
}

/** Stable string for memo: only errors that affect this row’s cells (not header row). */
export function rowCellValidationSignature(
  rowId: number,
  columns: ReadonlyArray<{ key: string }>,
  validation: ExpandableTableValidationResult
): string {
  let s = "";
  for (const col of columns) {
    const ck = cellErrorKey(rowId, col.key);
    s += `${validation.cellErrorByKey.get(ck) ?? ""}\t`;
    s += `${validation.columnErrorByKey.get(col.key) ?? ""}\t`;
    const pf = validation.cellPhaseFeedbackByKey.get(ck);
    s += `${pf?.phase ?? ""}\t${pf?.message ?? ""}\t`;
  }
  return s;
}

/** Stable string for `TableHeaderRow` memo: header + duplicate key state only (ignores body cell maps). */
export function headerRowValidationSignature(
  validation: ExpandableTableValidationResult
): string {
  const dup = [...validation.duplicateHeaderKeys].sort().join(",");
  const headerKeys = Object.keys(validation.headerErrorByKey).sort();
  const headerErrs = headerKeys
    .map((k) => `${k}:${validation.headerErrorByKey[k] ?? ""}`)
    .join("|");
  return `${dup}#${headerErrs}`;
}

function normalizeHeaderLabel(header: string): string {
  return header.trim().toLowerCase();
}

/** Columns whose header (trim + lowercase) matches another column. */
export function computeDuplicateHeaderKeys(
  columns: { key: string; header: string }[]
): Set<string> {
  const buckets = new Map<string, string[]>();
  for (const col of columns) {
    const label = normalizeHeaderLabel(col.header);
    const list = buckets.get(label);
    if (list) list.push(col.key);
    else buckets.set(label, [col.key]);
  }
  const dup = new Set<string>();
  for (const keys of buckets.values()) {
    if (keys.length > 1) {
      for (const k of keys) dup.add(k);
    }
  }
  return dup;
}

function mergeCellErrors(
  columns: InternalColumn[],
  rows: InternalRow[],
  messages: { required: string; unique: string }
): Map<string, string> {
  const out = new Map<string, string>();

  for (const col of columns) {
    if (!col.required && !col.unique) continue;

    const valueToRowIds = col.unique ? new Map<string, number[]>() : null;

    for (const row of rows) {
      const raw = row.values[col.key] ?? "";
      const v = raw.trim();

      if (col.required && !v) {
        out.set(cellErrorKey(row.id, col.key), messages.required);
      }

      if (valueToRowIds && v !== "") {
        const list = valueToRowIds.get(v);
        if (list) list.push(row.id);
        else valueToRowIds.set(v, [row.id]);
      }
    }

    if (valueToRowIds) {
      for (const rowIds of valueToRowIds.values()) {
        if (rowIds.length <= 1) continue;
        for (const id of rowIds) {
          const key = cellErrorKey(id, col.key);
          if (!out.has(key)) out.set(key, messages.unique);
        }
      }
    }
  }

  return out;
}

function mergeColumnCustomValidation(
  columns: InternalColumn[],
  rows: InternalRow[],
  context: unknown,
  defaultColumnInvalid: string
): Map<string, string> {
  const columnErrorByKey = new Map<string, string>();

  for (const col of columns) {
    if (!col.columnValidator) continue;

    const ok = col.columnValidator(
      {
        columnKey: col.key,
        rows: rows.map((r) => ({ id: r.id, values: r.values })),
      },
      context
    );

    if (!ok) {
      const i18nKey = col.columnInvalidMessageI18nKey?.trim();
      const msg = i18nKey || defaultColumnInvalid;
      columnErrorByKey.set(col.key, msg);
    } else {
      columnErrorByKey.delete(col.key);
    }
  }

  return columnErrorByKey;
}

function mergeCellPhaseFeedback(
  columns: InternalColumn[],
  rows: InternalRow[],
  context: unknown
): Map<string, ExpandableTableCellPhaseFeedback> {
  const out = new Map<string, ExpandableTableCellPhaseFeedback>();
  for (const col of columns) {
    if (!col.cellFeedbackResolver) continue;
    const slice = col.cellFeedbackResolver(
      {
        columnKey: col.key,
        rows: rows.map((r) => ({ id: r.id, values: r.values })),
      },
      context
    );
    for (const [k, v] of slice) {
      out.set(k, v);
    }
  }
  return out;
}

function hasBlockingPhaseFeedback(map: Map<string, ExpandableTableCellPhaseFeedback>): boolean {
  for (const v of map.values()) {
    if (v.phase === FIELD_VALIDATION_PHASE.ERROR) return true;
  }
  return false;
}

export function computeExpandableTableValidation(
  columns: InternalColumn[],
  rows: InternalRow[],
  messages: ExpandableTableValidationMessages | undefined,
  cellValidationContext: unknown
): ExpandableTableValidationResult {
  messages ??= {};
  const dupHeaderMsg = messages.duplicateHeader ?? DEFAULT_VALIDATION_MESSAGES.duplicateHeader;
  const reqMsg = messages.required ?? DEFAULT_VALIDATION_MESSAGES.required;
  const uniqMsg = messages.unique ?? DEFAULT_VALIDATION_MESSAGES.unique;
  const columnInvalidMsg =
    messages.columnInvalid ?? DEFAULT_VALIDATION_MESSAGES.columnInvalid;

  const duplicateHeaderKeys = computeDuplicateHeaderKeys(columns);
  const headerErrorByKey: Partial<Record<string, string>> = {};
  for (const key of duplicateHeaderKeys) {
    headerErrorByKey[key] = dupHeaderMsg;
  }
  for (const col of columns) {
    if (headerErrorByKey[col.key]) continue;
    if (col.removable && !col.header.trim()) {
      headerErrorByKey[col.key] = reqMsg;
    }
  }

  const cellErrorByKey = mergeCellErrors(columns, rows, {
    required: reqMsg,
    unique: uniqMsg,
  });

  const columnErrorByKey = mergeColumnCustomValidation(
    columns,
    rows,
    cellValidationContext,
    columnInvalidMsg
  );

  const cellPhaseFeedbackByKey = mergeCellPhaseFeedback(columns, rows, cellValidationContext);

  const hasHeaderError = columns.some((c) => Boolean(headerErrorByKey[c.key]));
  const isValid =
    !hasHeaderError &&
    cellErrorByKey.size === 0 &&
    columnErrorByKey.size === 0 &&
    !hasBlockingPhaseFeedback(cellPhaseFeedbackByKey);

  return {
    isValid,
    duplicateHeaderKeys,
    headerErrorByKey,
    cellErrorByKey,
    columnErrorByKey,
    cellPhaseFeedbackByKey,
  };
}
