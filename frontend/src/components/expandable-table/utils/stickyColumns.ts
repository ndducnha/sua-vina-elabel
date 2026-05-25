/** Right-edge shadow for the outer edge of the left-sticky stack (separates from scroll area). */
export const STICKY_LEFT_STACK_OUTER_SHADOW =
  "[box-shadow:4px_0_10px_-4px_rgba(15,23,42,0.12)]";

/** Left-edge shadow for sticky right column (add column / row actions). */
export const STICKY_RIGHT_STACK_OUTER_SHADOW =
  "[box-shadow:-4px_0_10px_-4px_rgba(15,23,42,0.12)]";

/** Matches `w-14` on index column — same value must drive sticky `left` offsets. */
export const STICKY_INDEX_WIDTH = "3.5rem";

/**
 * Last left-sticky data column to paint the right-side cluster shadow, or the index column when
 * there is no `permanent` column.
 */
export function resolveLastLeftStickyEdgeKey(
  tableColumns: ReadonlyArray<{ key: string; permanent: boolean }>,
  showIndexColumn: boolean,
): "index" | string | null {
  for (let i = tableColumns.length - 1; i >= 0; i--) {
    if (tableColumns[i].permanent) {
      return tableColumns[i].key;
    }
  }
  if (showIndexColumn) return "index";
  return null;
}

/** Lock STT column width so it matches `permanentDataColumnLeft` when `showIndexColumn`. */
export const stickyIndexCellStyle = {
  width: STICKY_INDEX_WIDTH,
  minWidth: STICKY_INDEX_WIDTH,
  maxWidth: STICKY_INDEX_WIDTH,
  boxSizing: "border-box" as const,
};

export const STICKY_DATA_COLUMN_MIN_PX = 170;

export function resolveColumnMinWidthPx(column: { columnMinWidthPx?: number }): number {
  return column.columnMinWidthPx ?? STICKY_DATA_COLUMN_MIN_PX;
}

/**
 * `left` for a permanent data column: cumulative width of STT (if any) + prior permanent columns.
 */
export function permanentDataColumnLeft(
  showIndexColumn: boolean,
  permanentColumnsBefore: number
): string {
  if (!showIndexColumn && permanentColumnsBefore === 0) return "0px";
  const indexPart = showIndexColumn ? STICKY_INDEX_WIDTH : "0px";
  if (permanentColumnsBefore === 0) {
    return showIndexColumn ? indexPart : "0px";
  }
  return showIndexColumn
    ? `calc(${indexPart} + ${permanentColumnsBefore} * ${STICKY_DATA_COLUMN_MIN_PX}px)`
    : `calc(${permanentColumnsBefore} * ${STICKY_DATA_COLUMN_MIN_PX}px)`;
}
