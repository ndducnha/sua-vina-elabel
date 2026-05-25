import { CircleX, X } from "lucide-react";
import { memo, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

import {
  parseDynamicFilterMultiValues,
  serializeDynamicFilterMultiValues,
  type DynamicFilterField,
} from "../../types";

export type ActiveFilterChipsProps = {
  fields: DynamicFilterField[];
  values: Record<string, string>;
  setFilterValue: (id: string, value: string) => void;
  onClearAll?: () => void;
};

type ChipMeta = {
  id: string; // Used as React key, combining field id and specific value
  value: string;
  displayLabel: string;
};

type FieldGroup = {
  fieldId: string;
  fieldLabel: string;
  chips: ChipMeta[];
};

function buildActiveFilterGroups(
  fields: DynamicFilterField[],
  values: Record<string, string>,
): { groups: FieldGroup[]; totalChipsCount: number } {
  const groups: FieldGroup[] = [];
  let totalChipsCount = 0;

  for (const field of fields) {
    if (field.type !== "multiselect") continue;
    if (field.hideChip) continue;

    const rawValue = values[field.id];
    if (!rawValue) continue;

    const group: FieldGroup = {
      fieldId: field.id,
      fieldLabel: field.filterLabel ?? field.id,
      chips: [],
    };

    const optionMap = new Map(field.options.map((opt) => [opt.value, opt] as const));
    const selectedSet = new Set(parseDynamicFilterMultiValues(rawValue));
    for (const val of selectedSet) {
      const option = optionMap.get(val);
      if (option) {
        group.chips.push({
          id: `${field.id}-${val}`,
          value: val,
          displayLabel: option.label,
        });
      }
    }

    if (group.chips.length > 0) {
      groups.push(group);
      totalChipsCount += group.chips.length;
    }
  }

  return { groups, totalChipsCount };
}

type ChipProps = {
  chip: ChipMeta;
  fieldId: string;
  onRemoveChip: (fieldId: string, value: string) => void;
};

const Chip = memo(function Chip({ chip, fieldId, onRemoveChip }: ChipProps) {
  const handleRemove = useCallback(() => {
    onRemoveChip(fieldId, chip.value);
  }, [onRemoveChip, fieldId, chip.value]);

  return (
    <Badge
      variant="secondary"
      className="flex min-w-0 shrink-0 items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 font-medium text-slate-700 hover:bg-slate-200 sm:max-w-36 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
    >
      <Tooltip>
        <TooltipTrigger className="min-w-0 max-w-full flex-1 text-left">
          <span className="block min-w-0 truncate">{chip.displayLabel}</span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="z-100 max-w-sm text-pretty wrap-break-word"
        >
          {chip.displayLabel}
        </TooltipContent>
      </Tooltip>
      <button
        type="button"
        className="-mr-0.5 flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-slate-300/50 dark:hover:bg-slate-600/50"
        onClick={handleRemove}
      >
        <X className="size-3" />
        <span className="sr-only">Remove {chip.displayLabel}</span>
      </button>
    </Badge>
  );
});

type ChipGroupProps = {
  group: FieldGroup;
  onRemoveChip: (fieldId: string, value: string) => void;
  onClearGroup: (fieldId: string) => void;
};

const ChipGroup = memo(function ChipGroup({ group, onRemoveChip, onClearGroup }: ChipGroupProps) {
  const { t } = useTranslation();

  const clearThisGroup = useCallback(() => {
    onClearGroup(group.fieldId);
  }, [onClearGroup, group.fieldId]);

  return (
    <div className="flex h-full min-h-0 min-w-0 items-center gap-1 rounded-lg border border-border bg-white p-2 shadow-sm dark:bg-slate-900">
      <span className="shrink-0 px-1 text-xs font-medium text-slate-500">{group.fieldLabel}:</span>
      <div
        className="max-h-12 flex min-h-0 min-w-0 flex-1 flex-wrap content-start items-center gap-1.5 overflow-x-hidden overflow-y-auto px-0.5 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
        data-slot="active-filter-chips-badges"
      >
        {group.chips.map((chip) => (
          <Chip
            key={chip.id}
            fieldId={group.fieldId}
            chip={chip}
            onRemoveChip={onRemoveChip}
          />
        ))}
      </div>
      {group.chips.length > 1 && (
        <Tooltip>
          <TooltipTrigger className="inline-flex shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-destructive/90"
              onClick={clearThisGroup}
              aria-label={t("dynamicTable.removeThisFilter")}
            >
              <CircleX className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center">
            {t("dynamicTable.removeThisFilter")}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
});

function ActiveFilterChipsInner({
  fields,
  values,
  setFilterValue,
  onClearAll,
}: ActiveFilterChipsProps) {
  const { t } = useTranslation();

  const { groups, totalChipsCount } = useMemo(
    () => buildActiveFilterGroups(fields, values),
    [fields, values],
  );

  const fieldById = useMemo(() => new Map(fields.map((f) => [f.id, f] as const)), [fields]);

  const handleRemoveChip = useCallback(
    (fieldId: string, value: string) => {
      const field = fieldById.get(fieldId);
      if (!field || field.type !== "multiselect") return;

      const currentRaw = values[fieldId];
      const selected = new Set(parseDynamicFilterMultiValues(currentRaw));
      selected.delete(value);
      setFilterValue(fieldId, serializeDynamicFilterMultiValues(selected));
    },
    [fieldById, setFilterValue, values],
  );

  const handleClearGroup = useCallback(
    (fieldId: string) => {
      setFilterValue(fieldId, "");
    },
    [setFilterValue],
  );

  if (groups.length === 0) return null;

  return (
    <div
      className="flex w-full min-w-0 max-w-full flex-col gap-2 self-stretch"
      data-slot="active-filter-chips"
    >
      {onClearAll && totalChipsCount > 0 && (
        <div className="flex shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-8 px-2 text-xs font-normal text-slate-500 hover:text-destructive dark:text-slate-400 dark:hover:text-slate-100 hover:bg-transparent"
          >
            {t("common.clearAllFilters")}
          </Button>
        </div>
      )}
      <div
        className="max-h-[min(60svh,28rem)] w-full min-w-0 max-w-full box-border overflow-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700"
        data-slot="active-filter-chips-scroll"
      >
        <div
          className="grid w-full min-w-0 max-w-full auto-rows-min grid-cols-[repeat(auto-fit,minmax(min(100%,12rem),1fr))] items-stretch gap-2"
        >
          {groups.map((group) => (
            <ChipGroup
              key={group.fieldId}
              group={group}
              onRemoveChip={handleRemoveChip}
              onClearGroup={handleClearGroup}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const ActiveFilterChips = memo(ActiveFilterChipsInner);
