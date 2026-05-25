import { memo, useCallback, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { DynamicFilterField } from "../../types";
import { DateRangeFilterField } from "./DateRangeFilterField";
import { DebouncedSearchField } from "./DebouncedSearchField";
import { MultiselectFilterControl } from "./MultiselectFilterControl";
import { SelectFilterField } from "./SelectFilterField";
import { ActiveFilterChips } from "./ActiveFilterChips";

export type DynamicTableFiltersValuesUpdater = (
  prev: Record<string, string>
) => Record<string, string>;

/** Search grows on wide layouts; override via `field.className` if needed. */
const FILTER_SEARCH_WRAP =
  "w-full min-w-0 max-w-full md:flex-1 md:basis-0 md:min-w-[12rem]";
/** Full width on small screens; fixed width from `md` (matches table toolbar). */
const FILTER_MULTI_WRAP = "w-full min-w-0 max-w-full md:w-66 md:shrink-0";
const FILTER_SELECT_WRAP = "w-full min-w-0 max-w-full md:w-44 md:shrink-0";
const FILTER_DATERANGE_WRAP =
  "w-full min-w-0 max-w-full md:min-w-[12rem] md:max-w-[24rem] md:shrink-0";

type DynamicTableFiltersProps = {
  fields: DynamicFilterField[];
  values: Record<string, string>;
  onValuesChange: (
    next: Record<string, string> | DynamicTableFiltersValuesUpdater
  ) => void;
  /** Ignored when `showSubmitButton` is false. */
  onSubmit?: () => void;
  submitLabel?: string;
  /** Default true. Set false for lists that apply filters immediately (e.g. server refetch on change). */
  showSubmitButton?: boolean;
  disabled?: boolean;
  className?: string;
  /** Extra control(s) after filter fields (e.g. mobile-only sort). */
  accessory?: ReactNode;
};

function DynamicTableFiltersInner({
  fields,
  values,
  onValuesChange,
  onSubmit,
  submitLabel,
  showSubmitButton = true,
  disabled,
  className,
  accessory,
}: DynamicTableFiltersProps) {
  const setFilterValue = useCallback(
    (id: string, v: string) => {
      onValuesChange((prev) => ({ ...prev, [id]: v }));
    },
    [onValuesChange]
  );

  return (
    <div className="flex flex-col">
      <div
        className={cn(
          "flex flex-col gap-3 rounded-lg md:flex-row md:flex-wrap md:items-end",
          className
        )}
      >
      {fields.map((field) => {
        if (field.type === "search") {
          return (
            <div key={field.id} className={cn(FILTER_SEARCH_WRAP, field.className)}>
              <DebouncedSearchField
                field={field}
                committedValue={values[field.id] ?? ""}
                disabled={disabled}
                setFilterValue={setFilterValue}
              />
            </div>
          );
        }

        if (field.type === "multiselect") {
          return (
            <div key={field.id} className={cn(FILTER_MULTI_WRAP, field.className)}>
              <Label className="sr-only">{field.filterLabel ?? field.placeholder ?? field.id}</Label>
              <MultiselectFilterControl
                field={field}
                rawValue={values[field.id]}
                disabled={disabled}
                setFilterValue={setFilterValue}
              />
            </div>
          );
        }

        if (field.type === "select") {
          return (
            <div key={field.id} className={cn(FILTER_SELECT_WRAP, field.className)}>
              <SelectFilterField
                field={field}
                value={values[field.id] ?? ""}
                disabled={disabled}
                setFilterValue={setFilterValue}
              />
            </div>
          );
        }

        if (field.type === "dateRange") {
          return (
            <div key={field.id} className={cn(FILTER_DATERANGE_WRAP, field.className)}>
              <Label className="sr-only">
                {field.filterLabel ?? field.id}
              </Label>
              <DateRangeFilterField
                field={field}
                values={values}
                disabled={disabled}
                setFilterValue={setFilterValue}
              />
            </div>
          );
        }

        return null;
      })}
      {accessory ? <div className="w-full min-w-0">{accessory}</div> : null}
      {showSubmitButton ? (
        <Button
          type="button"
          onClick={onSubmit ?? (() => {})}
          disabled={disabled}
          className="h-9 shrink-0 md:min-w-[120px]"
        >
          {submitLabel ?? "Apply"}
        </Button>
      ) : null}
      </div>
      
      <ActiveFilterChips
        fields={fields}
        values={values}
        setFilterValue={setFilterValue}
        onClearAll={() => onValuesChange({})}
      />
    </div>
  );
}

export const DynamicTableFilters = memo(DynamicTableFiltersInner);
