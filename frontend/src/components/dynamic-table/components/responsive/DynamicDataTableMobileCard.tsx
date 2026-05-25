import { flexRender, type Row, type Table as TanstackTable } from "@tanstack/react-table";
import { memo } from "react";
import { Link } from "react-router";

import type { DynamicTableColumnMeta } from "../../types";
import { cn } from "@/lib/utils";

type DynamicDataTableMobileCardProps<TData> = {
  table: TanstackTable<TData>;
  row: Row<TData>;
  isSelected: boolean;
};

function DynamicDataTableMobileCardInner<TData>({
  table,
  row,
  isSelected,
}: DynamicDataTableMobileCardProps<TData>) {
  const headerGroup = table.getHeaderGroups()[0];
  const headers = headerGroup?.headers ?? [];

  return (
    <article
      data-slot="dynamic-data-table-mobile-card"
      data-state={isSelected ? "selected" : undefined}
      className={cn(
        "rounded-lg border border-border bg-card px-4 py-3 text-card-foreground shadow-sm",
        "data-[state=selected]:bg-muted/50"
      )}
    >
      <dl className="flex flex-col gap-2.5">
        {row.getVisibleCells().map((cell) => {
          const header = headers.find((h) => h.column.id === cell.column.id);
          const label = header ? (
            flexRender(header.column.columnDef.header, header.getContext())
          ) : (
            <span className="text-muted-foreground">{cell.column.id}</span>
          );

          const raw = flexRender(cell.column.columnDef.cell, cell.getContext());
          const meta = (cell.column.columnDef.meta ?? {}) as DynamicTableColumnMeta<TData>;
          const to = meta.linkToRow?.(row.original);
          const value = to ? (
            <Link
              to={to}
              state={meta.linkState?.(row.original)}
              className={cn("text-end", meta.linkClassName)}
              onClick={(e) => e.stopPropagation()}
            >
              {raw}
            </Link>
          ) : (
            raw
          );

          return (
            <div
              key={cell.id}
              className="flex min-w-0 items-start gap-3"
            >
              <dt className="min-w-0 flex-1 basis-0 text-xs font-medium leading-snug text-muted-foreground">
                {label}
              </dt>
              <dd className="flex min-w-0 flex-1 basis-0 flex-col items-end justify-center gap-1 text-end text-sm leading-snug [&_.font-mono]:text-xs">
                <div
                  className="line-clamp-2 break-all w-full text-end"
                  title={typeof cell.getValue() === "string" || typeof cell.getValue() === "number" ? String(cell.getValue()) : undefined}
                >
                  {value}
                </div>
              </dd>
            </div>
          );
        })}
      </dl>
    </article>
  );
}

function mobileCardPropsAreEqual<TData>(
  prev: DynamicDataTableMobileCardProps<TData>,
  next: DynamicDataTableMobileCardProps<TData>
): boolean {
  if (prev.table !== next.table) return false;
  if (prev.row.id !== next.row.id) return false;
  if (prev.row.original !== next.row.original) return false;
  if (prev.isSelected !== next.isSelected) return false;
  return true;
}

export const DynamicDataTableMobileCard = memo(
  DynamicDataTableMobileCardInner,
  mobileCardPropsAreEqual
) as typeof DynamicDataTableMobileCardInner;
