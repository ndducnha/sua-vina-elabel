import { memo, useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { DynamicFilterField } from "../../types";

export type DebouncedSearchFieldProps = {
  field: Extract<DynamicFilterField, { type: "search" }>;
  committedValue: string;
  disabled?: boolean;
  /** Stable updater (e.g. from `useCallback` in `DynamicTableFilters`) so memoized fields do not rerender every parent tick. */
  setFilterValue: (id: string, value: string) => void;
};

function DebouncedSearchFieldInner({
  field,
  committedValue,
  disabled,
  setFilterValue,
}: DebouncedSearchFieldProps) {
  const [local, setLocal] = useState(committedValue);
  const debounceMs = field.debounceMs ?? 0;
  const setFilterValueRef = useRef(setFilterValue);
  setFilterValueRef.current = setFilterValue;

  useEffect(() => {
    setLocal(committedValue);
  }, [committedValue]);

  useEffect(() => {
    if (debounceMs <= 0) return;
    if (local === committedValue) return;
    const timer = window.setTimeout(
      () => setFilterValueRef.current(field.id, local),
      debounceMs
    );
    return () => window.clearTimeout(timer);
  }, [local, committedValue, debounceMs, field.id]);

  const handleChange = (next: string) => {
    setLocal(next);
    if (debounceMs <= 0) {
      setFilterValueRef.current(field.id, next);
    }
  };

  return (
    <>
      <Label htmlFor={`filter-${field.id}`} className="sr-only">
        {field.filterLabel ?? field.placeholder ?? field.id}
      </Label>
      <Input
        id={`filter-${field.id}`}
        type="search"
        value={local}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        className="h-9 w-full min-w-0 bg-white dark:bg-white disabled:bg-neutral-100 dark:disabled:bg-neutral-200"
      />
    </>
  );
}

export const DebouncedSearchField = memo(DebouncedSearchFieldInner) as typeof DebouncedSearchFieldInner;
