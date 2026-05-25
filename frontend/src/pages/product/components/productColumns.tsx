import type { TFunction } from "i18next";
import type { ColumnDef } from "@tanstack/react-table";
import { ExternalLink, QrCode, ScanLine } from "lucide-react";
import { Link } from "react-router";

const LANDING_BASE_URL =
  (import.meta.env.VITE_ELABEL_LANDING_BASE_URL as string | undefined) ?? "http://127.0.0.1:3002";

function landingUrl(gtin: string | null | undefined, taxCode: string | null | undefined): string | null {
  const g = (gtin ?? "").trim();
  const t = (taxCode ?? "").trim();
  if (!g || !t) return null;
  return `${LANDING_BASE_URL.replace(/\/$/, "")}/01/${encodeURIComponent(g)}?tax_code=${encodeURIComponent(t)}`;
}

import { UserMode, UserRole } from "@/models/auth.model";
import { ProductStatus, type Product } from "@/models/product.model";
import { NationalSyncCell } from "./NationalSyncCell";

function statusBadgeClass(status: ProductStatus): string {
  const base =
    "inline-flex whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium";
  if (status === ProductStatus.DRAFT) {
    return `${base} bg-muted text-muted-foreground`;
  }
  if (status === ProductStatus.PUBLISHED) {
    return `${base} bg-teal-500/15 text-teal-800 dark:text-teal-300`;
  }
  return `${base} bg-amber-500/15 text-amber-900 dark:text-amber-200`;
}

export type ProductColumnsContext = {
  onViewBusiness?: (enterpriseId: string, enterpriseName: string) => void;
  locale: string;
  /** Kept for backward-compat with callers; role-based columns are no longer used. */
  viewerRole: UserRole;
  /** Kept for backward-compat; the simplified table is the same for VNPC and internal. */
  userMode: UserMode;
};

/**
 * Internal Sữa Vina product list — 5 columns:
 *   Chi tiết · Mã GTIN quốc tế · Tên sản phẩm · Trạng thái · Đồng bộ Nhãn quốc gia
 */
export function createProductColumns(
  t: TFunction,
  _ctx: ProductColumnsContext,
): ColumnDef<Product, unknown>[] {
  return [
    {
      id: "detail",
      header: t("product.table.detail"),
      enableSorting: false,
      meta: {
        linkToRow: (row: Product) => `/products/${row.id}`,
        linkState: (row: Product) => ({ name: row.name }),
        linkClassName:
          "inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:underline",
      },
      cell: () => (
        <span className="inline-flex items-center gap-1.5 text-secondary">
          {t("product.table.detailView")}
          <ExternalLink className="size-3.5 shrink-0 opacity-90" aria-hidden />
        </span>
      ),
    },
    {
      id: "international_gtin",
      accessorFn: (row) => (row.gtin ?? "").trim(),
      enableSorting: false,
      header: t("product.table.internationalGtin"),
      cell: ({ row }) => (
        <span className="font-mono text-sm tabular-nums text-foreground">
          {(row.original.gtin ?? "").trim() || "—"}
        </span>
      ),
    },
    {
      accessorKey: "name",
      id: "product_name",
      enableSorting: true,
      header: t("product.table.productName"),
      cell: ({ getValue }) => (
        <div className="min-w-[200px] max-w-md text-sm leading-snug">{getValue() as string}</div>
      ),
    },
    {
      accessorKey: "status",
      id: "status",
      enableSorting: false,
      header: t("product.table.status"),
      cell: ({ getValue }) => {
        const v = getValue() as ProductStatus;
        const labelKey =
          v === ProductStatus.DRAFT
            ? "product.status.draft"
            : v === ProductStatus.PUBLISHED
              ? "product.status.published"
              : "product.status.recalled";
        return <span className={statusBadgeClass(v)}>{t(labelKey)}</span>;
      },
    },
    {
      id: "national_sync",
      header: t("product.table.nationalSync"),
      enableSorting: false,
      cell: ({ row }) => <NationalSyncCell productId={row.original.id} />,
    },
    {
      id: "qr_export",
      header: t("product.table.printQr"),
      enableSorting: false,
      cell: ({ row }) => (
        <Link
          to={`/products/${row.original.id}/qr-export`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
        >
          <QrCode className="h-3.5 w-3.5" /> {t("product.table.printQrAction")}
        </Link>
      ),
    },
    {
      id: "open_landing",
      header: t("product.table.openLanding"),
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original as unknown as { gtin?: string; tax_code?: string; taxCode?: string };
        const url = landingUrl(r.gtin, r.tax_code ?? r.taxCode);
        if (!url) return <span className="text-xs text-slate-400">—</span>;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <ScanLine className="h-3.5 w-3.5" /> {t("product.table.openLandingAction")}
          </a>
        );
      },
    },
  ];
}
