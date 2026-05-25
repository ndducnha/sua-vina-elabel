/**
 * Sort send to server — `columnId` matches `id` / `accessorKey` of TanStack column (map to BE query at service).
 */
export type ServerSortState = {
  columnId: string;
  desc: boolean;
} | null;

/**
 * Standard list query for API: filter + sort + pagination (page 1-based).
 */
export type ServerListQuery = {
  page: number;
  pageSize: number;
  sort: ServerSortState;
  /** Filter fields (search text, id select, …) — map to query params at each service. */
  filters: Record<string, string>;
};

/**
 * Optional `meta` on TanStack `ColumnDef` (desktop + mobile) supported by
 * `DynamicDataTable` / `DynamicDataTableMobileCard`.
 */
export type DynamicTableColumnMeta<TData> = {
  /**
   * When set, the cell (and the mobile card value) is wrapped in a
   * `react-router` `<Link>`.
   */
  linkToRow?: (row: TData) => string;
  /** Optional `location.state` for react-router `<Link>`. */
  linkState?: (row: TData) => unknown;
  /** Extra classes for the link wrapper. */
  linkClassName?: string;
  /**
   * Sticky column for horizontal scroll (`bg` matches row/header so content
   * does not show through when scrolling).
   */
  sticky?: "left" | "right";
  /**
   * Inset from the sticky horizontal edge (CSS length).
   * - `sticky: "right"` → sets CSS `right` (distance from scrollport right); omit / `0px` for flush right.
   * - `sticky: "left"` → sets CSS `left`.
   * Use when multiple columns stick on the same side so they stack instead of overlapping at `0`.
   */
  stickyOffset?: string;
};

export type DynamicFilterField =
  | {
      id: string;
      type: "search";
      placeholder?: string;
      filterLabel?: string;
      className?: string;
      debounceMs?: number;
      hideChip?: boolean;
    }
  | {
      id: string;
      type: "select";
      placeholder?: string;
      filterLabel?: string;
      options: { value: string; label: string }[];
      className?: string;
      /**
       * Trimmed values that mean “no filter” — omit this query param entirely.
       * E.g. `["all"]` for a sentinel “all” option.
       */
      omitSelectValues?: readonly string[];
      hideChip?: boolean;
      /**
       * Force searchable dropdown (`false` = never, `true` = always).
       * When omitted, search appears when `options.length >= 10` (same as `DropdownSelect`).
       */
      searchable?: boolean;
    }
  | {
      id: string;
      type: "dateRange";
      fromKey: string;
      toKey: string;
      filterLabel?: string;
      className?: string;
      hideChip?: boolean;
    }
  | {
      id: string;
      type: "multiselect";
      filterLabel?: string;
      options: { value: string; label: string }[];
      /**
       * Trigger label when nothing is selected (e.g. translated “All”).
       * Falls back to `placeholder` if set.
       */
      emptySummary?: string;
      placeholder?: string;
      /**
       * Trigger label when at least one option is selected. Use `{{count}}` for number of selections.
       * Default: `"{{count}} selected"`.
       */
      selectedSummary?: string;
      /**
       * When set, overrides `selectedSummary` (e.g. i18n `t("key", { count })`).
       */
      formatSelectedSummary?: (count: number) => string;
      className?: string;
      /** Passed to dropdown content (width, max-height, …). */
      menuContentClassName?: string;
      hideChip?: boolean;
      /**
       * Force searchable option list (`false` = label header only).
       * When omitted, search appears when `options.length >= 10`.
       */
      searchable?: boolean;
    }

/** Parse comma-separated multiselect value from `ServerListQuery.filters`. */
export function parseDynamicFilterMultiValues(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Stable comma-separated string for multiselect filter values. */
export function serializeDynamicFilterMultiValues(values: Iterable<string>): string {
  return [...values].map((s) => s.trim()).filter(Boolean).sort().join(",");
}
