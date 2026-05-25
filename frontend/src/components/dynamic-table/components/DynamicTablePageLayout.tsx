import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DynamicTablePageLayoutProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  headerEnd?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function DynamicTablePageLayout({
  title,
  subtitle,
  headerEnd,
  children,
  className,
}: DynamicTablePageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {headerEnd ? <div className="shrink-0 sm:pt-1">{headerEnd}</div> : null}
      </div>
      {children}
    </div>
  );
}
