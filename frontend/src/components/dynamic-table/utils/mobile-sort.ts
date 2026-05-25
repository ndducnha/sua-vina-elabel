import type { SortingState } from "@tanstack/react-table";

/** One sortable column for mobile twin `<select>` (id = TanStack column id / server `sort_by`). */
export type MobileSortColumnOption = {
  id: string;
  label: string;
};

export function singleColumnSortingState(columnId: string, desc: boolean): SortingState {
  return [{ id: columnId, desc }];
}

/**
 * Maps current `sorting` to a valid pair for twin dropdowns when the active column
 * may not be in `sortableColumns` (e.g. hidden column).
 */
export function resolveMobileTwinSort(
  sorting: SortingState,
  sortableColumns: readonly MobileSortColumnOption[]
): { columnId: string; desc: boolean } {
  if (sortableColumns.length === 0) {
    return { columnId: "", desc: false };
  }
  const allowed = new Set(sortableColumns.map((c) => c.id));
  const first = sorting[0];
  const id = first?.id;
  const desc = first?.desc ?? false;
  if (id && allowed.has(id)) {
    return { columnId: id, desc };
  }
  return { columnId: sortableColumns[0].id, desc: true };
}
