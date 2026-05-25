import { memo } from "react";

import { cn } from "@/lib/utils";

export type DynamicTableSummaryTone = "default" | "success" | "destructive";

export type DynamicTableSummaryItem = {
  id: string;
  label: string;
  value: string | number;
  tone?: DynamicTableSummaryTone;
};

export type DynamicTableSummaryBarProps = {
  items: DynamicTableSummaryItem[];
  className?: string;
  /** Accessible name for the metrics region (e.g. translated string). */
  "aria-label"?: string;
};

const toneClass: Record<DynamicTableSummaryTone, string> = {
  default: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  destructive: "text-red-600 dark:text-red-500",
};

/**
 * Horizontal summary metrics above a data table. Pass `items` from the parent;
 * wire API data when available (values can replace hardcoded placeholders).
 */
export const DynamicTableSummaryBar = memo(function DynamicTableSummaryBar({
  items,
  className,
  "aria-label": ariaLabel,
}: DynamicTableSummaryBarProps) {
  if (!items.length) return null;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row gap-3 w-full",
        className
      )}
      role="region"
      aria-label={ariaLabel}
    >
      {items.map((item) => {
        const tone = item.tone ?? "default";
        return (
          <div
            key={item.id}
            className="flex-1 min-w-0 rounded-lg border border-border/60 bg-[#D6E6F7] px-4 py-4 text-center shadow-none"
          >
            <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                "mt-1 text-2xl font-bold tracking-tight tabular-nums",
                toneClass[tone]
              )}
            >
              {item.value}
            </p>
          </div>
        );
      })}
    </div>
  );
});
