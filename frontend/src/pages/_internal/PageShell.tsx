import type { ReactNode } from "react";

type PageShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function PageShell({ title, subtitle, actions, children }: PageShellProps) {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}

type StatCardProps = {
  label: string;
  value: string | number;
  delta?: string;
  tone?: "default" | "success" | "warning" | "info";
};

export function StatCard({ label, value, delta, tone = "default" }: StatCardProps) {
  const toneClass = {
    default: "text-slate-900",
    success: "text-emerald-600",
    warning: "text-amber-600",
    info: "text-blue-600",
  }[tone];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${toneClass}`}>{value}</p>
      {delta && <p className="mt-1 text-xs text-slate-400">{delta}</p>}
    </div>
  );
}

type SimpleTableProps<Row> = {
  columns: { key: keyof Row | string; label: string; align?: "left" | "right" | "center"; render?: (row: Row) => ReactNode }[];
  rows: Row[];
  emptyText?: string;
};

export function SimpleTable<Row extends Record<string, unknown>>({
  columns,
  rows,
  emptyText = "Không có dữ liệu",
}: SimpleTableProps<Row>) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={String(c.key)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-600 text-${c.align ?? "left"}`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-slate-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50/40">
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={`px-4 py-3 text-${c.align ?? "left"} text-slate-700`}
                    >
                      {c.render ? c.render(row) : String(row[c.key as keyof Row] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Pill({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "success" | "info" | "warning" | "danger" | "neutral";
}) {
  const cls = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    info: "bg-blue-50 text-blue-700 border-blue-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  }[tone];
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {children}
    </span>
  );
}
