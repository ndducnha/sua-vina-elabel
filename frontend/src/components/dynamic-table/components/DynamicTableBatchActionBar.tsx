import { ListTodo } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type DynamicTableBatchActionBarProps = {
  selectedCount: number;
  /** Left side label, e.g. translated “{{count}} items selected”. */
  summary: ReactNode;
  /** Right side: bulk action buttons. */
  actions: ReactNode;
  className?: string;
};

/**
 * Toolbar shown when a data table has row selection and `selectedCount > 0`.
 */
export function DynamicTableBatchActionBar({
  selectedCount,
  summary,
  actions,
  className,
}: DynamicTableBatchActionBarProps) {
  if (selectedCount < 1) {
    return null;
  }

  return (
    <div
      role="toolbar"
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 rounded-lg border-none bg-secondary/20 px-3 py-2.5",
        className
      )}
    >
      <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-foreground">
        <ListTodo className="text-primary size-4 shrink-0" aria-hidden />
        <span className="min-w-0 text-primary font-bold">{summary}</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
    </div>
  );
}
