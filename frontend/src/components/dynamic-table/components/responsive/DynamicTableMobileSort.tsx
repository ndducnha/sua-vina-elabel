import type { OnChangeFn, SortingState } from "@tanstack/react-table";
import { memo, useMemo } from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import {
  type MobileSortColumnOption,
  resolveMobileTwinSort,
  singleColumnSortingState,
} from "../../utils";

const selectClassName =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-white px-2.5 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-white disabled:bg-neutral-100 dark:disabled:bg-neutral-200";

export type DynamicTableMobileSortLabels = {
  ascending: string;
  descending: string;
  fieldAriaLabel: string;
  directionAriaLabel: string;
};

export type DynamicTableMobileSortProps = {
  sorting: SortingState;
  onSortingChange: OnChangeFn<SortingState>;
  sortableColumns: MobileSortColumnOption[];
  labels: DynamicTableMobileSortLabels;
  disabled?: boolean;
  className?: string;
  /** Prefix for `id` / `htmlFor` when multiple instances exist on the page. */
  idPrefix?: string;
};

function DynamicTableMobileSortInner({
  sorting,
  onSortingChange,
  sortableColumns,
  labels,
  disabled,
  className,
  idPrefix = "dynamic-table-mobile-sort",
}: DynamicTableMobileSortProps) {
  const { columnId, desc } = useMemo(
    () => resolveMobileTwinSort(sorting, sortableColumns),
    [sorting, sortableColumns]
  );

  const directionValue = desc ? "desc" : "asc";

  const applySort = (nextColumnId: string, nextDesc: boolean) => {
    onSortingChange(singleColumnSortingState(nextColumnId, nextDesc));
  };

  if (sortableColumns.length === 0) {
    return null;
  }

  const fieldId = `${idPrefix}-field`;
  const directionId = `${idPrefix}-direction`;

  return (
    <div className={cn("flex w-full min-w-0 flex-row items-stretch gap-2", className)}>
      <div className="min-w-0 flex-1">
        <Label htmlFor={fieldId} className="sr-only">
          {labels.fieldAriaLabel}
        </Label>
        <select
          id={fieldId}
          className={selectClassName}
          disabled={disabled}
          value={columnId}
          onChange={(e) => {
            applySort(e.target.value, desc);
          }}
        >
          {sortableColumns.map(({ id, label }) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="w-[min(42%,12rem)] shrink-0">
        <Label htmlFor={directionId} className="sr-only">
          {labels.directionAriaLabel}
        </Label>
        <select
          id={directionId}
          className={selectClassName}
          disabled={disabled}
          value={directionValue}
          onChange={(e) => {
            applySort(columnId, e.target.value === "desc");
          }}
        >
          <option value="asc">{labels.ascending}</option>
          <option value="desc">{labels.descending}</option>
        </select>
      </div>
    </div>
  );
}

export const DynamicTableMobileSort = memo(DynamicTableMobileSortInner);
