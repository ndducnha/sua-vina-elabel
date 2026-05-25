import { memo, useMemo } from "react";

import {
  DropdownSelect,
  DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS,
} from "@/components/form/DropdownSelect";

import type { DynamicFilterField } from "../../types";

export type SelectFilterFieldProps = {
  field: Extract<DynamicFilterField, { type: "select" }>;
  value: string;
  disabled?: boolean;
  setFilterValue: (id: string, value: string) => void;
};

function SelectFilterFieldInner({
  field,
  value,
  disabled,
  setFilterValue,
}: SelectFilterFieldProps) {
  const options = useMemo(() => {
    const base = field.options;
    if (field.placeholder) {
      return [{ value: "", label: field.placeholder }, ...base];
    }
    return base;
  }, [field.options, field.placeholder]);

  const triggerPlaceholder =
    field.placeholder ?? field.filterLabel ?? "All";

  return (
    <DropdownSelect
      value={value}
      options={options}
      placeholder={triggerPlaceholder}
      menuTitle={field.filterLabel ?? field.placeholder ?? field.id}
      disabled={disabled}
      onCommit={(v) => setFilterValue(field.id, v)}
      searchable={
        typeof field.searchable === "boolean"
          ? field.searchable
          : options.length >= DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS
      }
      className="mb-0 h-9 min-h-9"
    />
  );
}

export const SelectFilterField = memo(SelectFilterFieldInner) as typeof SelectFilterFieldInner;
