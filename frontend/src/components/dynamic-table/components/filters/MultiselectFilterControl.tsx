import { ChevronDownIcon } from "lucide-react";
import { memo, useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS,
  SearchableFilterDropdownMenuContent,
} from "@/components/form/DropdownSelect";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import { serializeDynamicFilterMultiValues, type DynamicFilterField } from "../../types";

function parseMultiSelectRaw(raw: string | undefined): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  );
}

function multiselectTriggerLabel(
  field: Extract<DynamicFilterField, { type: "multiselect" }>,
  selected: Set<string>
): string {
  if (selected.size === 0) {
    return field.emptySummary ?? field.placeholder ?? "All";
  }

  if (field.formatSelectedSummary) {
    return field.formatSelectedSummary(selected.size);
  }

  const selectedOptions = field.options.filter((o) => selected.has(o.value));

  if (selectedOptions.length === 0) {
    const template = field.selectedSummary ?? "{{count}} selected";
    return template.replace(/\{\{count\}\}/g, String(selected.size));
  }

  if (selectedOptions.length <= 2) {
    return selectedOptions.map((o) => o.label).join(", ");
  }

  return `${selectedOptions[0].label}, ${selectedOptions[1].label} +${selectedOptions.length - 2}`;
}

export type MultiselectFilterControlProps = {
  field: Extract<DynamicFilterField, { type: "multiselect" }>;
  rawValue: string | undefined;
  disabled?: boolean;
  setFilterValue: (id: string, value: string) => void;
};

function MultiselectFilterControlInner({
  field,
  rawValue,
  disabled,
  setFilterValue,
}: MultiselectFilterControlProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const selected = useMemo(() => parseMultiSelectRaw(rawValue), [rawValue]);

  const showSearch =
    field.searchable === true ||
    (field.searchable !== false && field.options.length >= DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS);

  const filteredOptions = useMemo(() => {
    if (!showSearch) return field.options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return field.options;
    return field.options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
    );
  }, [field.options, searchQuery, showSearch]);

  const toggle = useCallback(
    (value: string, checked: boolean) => {
      const next = new Set(selected);
      if (checked) next.add(value);
      else next.delete(value);
      setFilterValue(field.id, serializeDynamicFilterMultiValues(next));
    },
    [field.id, setFilterValue, selected]
  );

  const label = multiselectTriggerLabel(field, selected);
  const menuTitle = field.filterLabel ?? field.placeholder ?? field.id;
  const searchPh = t("common.searchOptions");

  return (
    <DropdownMenu
      highlightItemOnHover={!showSearch}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearchQuery("");
          return;
        }
        if (showSearch) {
          queueMicrotask(() => {
            requestAnimationFrame(() => {
              searchInputRef.current?.focus({ preventScroll: true });
            });
          });
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-9 w-full max-w-full min-w-0 justify-between gap-1 bg-white font-normal hover:bg-white dark:bg-white dark:hover:bg-white aria-expanded:bg-white"
          >
            <span className="truncate">{label}</span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
          </Button>
        }
      />
      <SearchableFilterDropdownMenuContent
        menuTitle={menuTitle}
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        searchPlaceholder={searchPh}
        menuContentClassName={field.menuContentClassName}
      >
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-2 py-3 text-center text-sm">
            {t("common.noData")}
          </div>
        ) : (
          filteredOptions.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              className="min-w-0 **:data-[slot=dropdown-menu-checkbox-item-indicator]:text-success-500"
              checked={selected.has(opt.value)}
              onCheckedChange={(checked) => toggle(opt.value, checked === true)}
            >
              <div className="min-w-0 max-w-full flex-1">
                <Tooltip>
                  <TooltipTrigger className="block min-w-0 max-w-full text-left">
                    <span className="block truncate">{opt.label}</span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="right"
                    align="start"
                    sideOffset={8}
                    className="z-100 max-w-sm text-pretty"
                  >
                    {opt.label}
                  </TooltipContent>
                </Tooltip>
              </div>
            </DropdownMenuCheckboxItem>
          ))
        )}
      </SearchableFilterDropdownMenuContent>
    </DropdownMenu>
  );
}

export const MultiselectFilterControl = memo(
  MultiselectFilterControlInner
) as typeof MultiselectFilterControlInner;

/** Values multiselect filters store in `ServerListQuery.filters` (comma-separated via `serializeDynamicFilterMultiValues`). */
export type MultiselectFilterQueryValue = string | number | boolean | string[] | null | undefined;

/**
 * URL query string for GET requests: each array entry becomes a repeated key
 * (`statuses=a&statuses=b`), matching typical multiselect filter encoding.
 */
export function serializeQueryParamsWithRepeatedArrayKeys(
  params: Record<string, MultiselectFilterQueryValue>
): string {
  const sp = new URLSearchParams();
  for (const [key, raw] of Object.entries(params)) {
    if (raw === undefined || raw === null) continue;
    if (Array.isArray(raw)) {
      for (const item of raw) {
        const s = String(item).trim();
        if (s) sp.append(key, s);
      }
    } else {
      sp.append(key, String(raw));
    }
  }
  return sp.toString();
}
