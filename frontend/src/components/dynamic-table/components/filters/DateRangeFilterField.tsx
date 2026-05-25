import type { ChangeEvent } from "react";
import { useId } from "react";
import { Calendar } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

import type { DynamicFilterField } from "../../types";

type DateRangeField = Extract<DynamicFilterField, { type: "dateRange" }>;

type DateRangeFilterFieldProps = {
  field: DateRangeField;
  values: Record<string, string>;
  disabled?: boolean;
  setFilterValue: (id: string, v: string) => void;
};

export function DateRangeFilterField({
  field,
  values,
  disabled,
  setFilterValue,
}: DateRangeFilterFieldProps) {
  const { t } = useTranslation();
  const fromId = useId();
  const toId = useId();
  const from = values[field.fromKey] ?? "";
  const to = values[field.toKey] ?? "";

  const formatDateDisplay = (dateStr: string, placeholder: string) => {
    if (!dateStr) return placeholder;
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [yyyy, MM, dd] = parts;
      return `${dd}-${MM}-${yyyy}`;
    }
    return dateStr;
  };

  const renderCustomDateInput = (
    id: string,
    value: string,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void,
    placeholder: string,
    min?: string
  ) => {
    return (
      <div className="relative h-9 w-full min-w-0 group rounded-lg">
        {/* Styled overlay displaying the formatted date */}
        <div
          className={cn(
            "pointer-events-none absolute inset-0 flex items-center justify-between rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors md:text-sm",
            "group-focus-within:border-ring group-focus-within:ring-3 group-focus-within:ring-ring/50",
            disabled && "bg-input/50 opacity-50 cursor-not-allowed",
            value ? "text-foreground font-normal" : "text-muted-foreground font-normal"
          )}
        >
          <span>{formatDateDisplay(value, placeholder)}</span>
          <Calendar className="size-4 text-muted-foreground opacity-60 shrink-0" aria-hidden />
        </div>
        {/* Native date input, absolutely positioned, transparent, covering the entire area */}
        <input
          id={id}
          type="date"
          className="absolute inset-0 w-full h-full cursor-pointer opacity-0 rounded-lg focus:outline-none"
          disabled={disabled}
          value={value}
          min={min}
          onChange={onChange}
          onClick={(e) => {
            if (!disabled && typeof e.currentTarget.showPicker === "function") {
              try {
                e.currentTarget.showPicker();
              } catch (err) {
                // Ignore error
              }
            }
          }}
        />
      </div>
    );
  };

  return (
    <div className={cn("flex w-full min-w-0 max-w-full flex-col gap-1.5", field.className)}>
      <span className="text-muted-foreground text-xs">
        {field.filterLabel ?? field.id}
      </span>
      <div className="grid w-full min-w-0 items-center gap-2 min-[400px]:grid-cols-[1fr_auto_1fr]">
        <div className="min-w-0">
          <Label htmlFor={fromId} className="sr-only">
            {field.filterLabel} — start
          </Label>
          {renderCustomDateInput(
            fromId,
            from,
            (e: ChangeEvent<HTMLInputElement>) =>
              setFilterValue(field.fromKey, e.target.value),
            t("common.startDatePlaceholder", "Chọn ngày bắt đầu")
          )}
        </div>
        <span className="text-center text-sm text-muted-foreground" aria-hidden>
          —
        </span>
        <div className="min-w-0">
          <Label htmlFor={toId} className="sr-only">
            {field.filterLabel} — end
          </Label>
          {renderCustomDateInput(
            toId,
            to,
            (e: ChangeEvent<HTMLInputElement>) =>
              setFilterValue(field.toKey, e.target.value),
            t("common.endDatePlaceholder", "Chọn ngày kết thúc"),
            from || undefined
          )}
        </div>
      </div>
    </div>
  );
}
