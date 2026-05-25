import { ClipboardList } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";

import { fetchProductGroupById } from "@/api/product";
import type { Product } from "@/models/product.model";
import { UserMode } from "@/models/auth.model";
import { useAuthStore } from "@/stores/auth.store";
import { ProductGallery } from "./ProductGallery";
import { ProductQrCard } from "./ProductQrCard";
import { ProductRiskCard } from "./ProductRiskCard";
import {
  buildDynamicAttributeRows,
  findAttr,
  formatProductMeta,
  val,
} from "../utils/product-meta";
import { getRiskBadge } from "../utils/product-risk-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type ProductInfoProps = {
  product: Product;
};

const CLAMP_LINES_CLASS = "line-clamp-3";

/** Desktop: shared fixed height between product info (left) and QR + risk (right). */
const PRODUCT_INFO_TOP_ROW_LG_SIZE = "lg:h-[36rem] lg:max-h-[36rem] lg:min-h-0";

type ExpandableClampTextProps = {
  text: string;
  preWrap?: boolean;
};

/** Collapses long text with line clamp; toggle labels come from i18n. */
function ExpandableClampText({ text, preWrap }: ExpandableClampTextProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [showToggle, setShowToggle] = useState(false);

  useLayoutEffect(() => {
    setExpanded(false);
  }, [text]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      if (expanded) return;
      setShowToggle(el.scrollHeight > el.clientHeight + 2);
    };

    const id = requestAnimationFrame(measure);
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(measure);
    });
    ro.observe(el);
    return () => {
      cancelAnimationFrame(id);
      ro.disconnect();
    };
  }, [text, expanded]);

  return (
    <div className="min-w-0">
      <div
        ref={ref}
        className={cn(
          "wrap-break-word font-normal leading-normal",
          preWrap && "whitespace-pre-wrap",
          !expanded && CLAMP_LINES_CLASS,
        )}
      >
        {text}
      </div>
      {showToggle && (
        <button
          type="button"
          className="text-primary mt-1.5 inline-block text-sm font-medium hover:underline cursor-pointer"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? t("product.detail.info.showLess") : t("product.detail.info.showMore")}
        </button>
      )}
    </div>
  );
}

// Sub-component: a single label-value row with a top border separator
function InfoRow({
  label,
  preWrap = false,
  blue = false,
  clampable = false,
  children,
  className,
}: {
  label: string;
  preWrap?: boolean;
  blue?: boolean;
  /** When true and `children` is a string, long values get a line-clamp + translated toggle. */
  clampable?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const useClamp = clampable && typeof children === "string";

  return (
    <>
      <dt
        className={cn(
          "text-muted-foreground border-border min-w-0 max-w-full wrap-break-word border-t py-2.5 pr-6 text-sm",
          className
        )}
      >
        {label}
      </dt>
      <dd
        className={cn(
          "border-border text-foreground min-w-0 wrap-break-word border-t py-2.5 text-sm font-normal leading-normal",
          blue && "text-blue-600 dark:text-blue-400",
          className,
        )}
        style={preWrap && !useClamp ? { whiteSpace: "pre-wrap" } : undefined}
      >
        {useClamp ? (
          <ExpandableClampText text={children} preWrap={preWrap} />
        ) : (
          children
        )}
      </dd>
    </>
  );
}

// Main component
export function ProductInfo({ product }: ProductInfoProps) {
  const { t } = useTranslation();
  const userMode = useAuthStore((s) => s.user?.mode ?? UserMode.VNPC);
  const isVnpc = userMode === UserMode.VNPC;
  const riskBadge = getRiskBadge(t, product.risk_level);

  const inter = product.inter_industry_attributes || [];
  const additional = product.additional_attributes || [];

  const dynamicRows = useMemo(() => buildDynamicAttributeRows(product), [product]);

  const identifierDisplay = useMemo(() => {
    return isVnpc
      ? (product.gtin ?? "").trim()
      : (product.sku ?? "").trim();
  }, [isVnpc, product.gtin, product.sku]);

  const supplierNameDisplay = useMemo(() => product.supplier?.trim() ?? "", [product.supplier]);

  const ownerEnterpriseDisplay = useMemo(() => {
    const go = product.gtin_owner;
    if (!go) return "";
    const parts = [go.name?.trim(), go.business_phone?.trim(), go.business_email?.trim()].filter(Boolean);
    return parts.join(" — ");
  }, [product.gtin_owner]);

  const productGroupId = product.product_group_id?.trim() ?? "";

  const { data: productGroupRes } = useQuery({
    queryKey: ["product-group", productGroupId],
    queryFn: () => fetchProductGroupById(productGroupId).then((r) => r.data),
    enabled: Boolean(productGroupId),
    staleTime: 5 * 60_000,
  });

  const regulatedGroupDisplay = useMemo(() => {
    const fromApi = productGroupRes?.data?.name?.trim();
    const fromProduct = product.product_group_name?.trim();
    return fromApi || fromProduct || "";
  }, [product.product_group_name, productGroupRes?.data?.name]);

  const classificationValue = useMemo(() => {
    const parts = [
      product.segment_name,
      product.family_name,
      product.class_name,
      product.brick_name,
    ]
      .map((s) => (s ?? "").trim())
      .filter(Boolean);
    return parts.length ? parts.join(" — ") : "";
  }, [
    product.brick_name,
    product.class_name,
    product.family_name,
    product.segment_name,
  ]);

  return (
    <div
      className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-stretch"
      data-product-id={product?.id}
    >
      {/* Card 1 — Thông tin sản phẩm */}
      <Card
        className={cn(
          "flex min-h-0 min-w-0 flex-col gap-2 overflow-hidden pb-2 lg:col-span-2",
          PRODUCT_INFO_TOP_ROW_LG_SIZE
        )}
      >
        {/* Header */}
        <CardHeader className="shrink-0 border-b pb-3">
          <div className="flex min-w-0 items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <ClipboardList className="text-primary size-5 shrink-0" aria-hidden />
              <CardTitle className="font-semibold text-primary">
                {t("product.detail.info.title")}
              </CardTitle>
            </div>
            {riskBadge && (
              <span
                className={`shrink-0 rounded-full px-3 py-0.5 text-xs font-medium ${riskBadge.cls}`}
              >
                {riskBadge.label}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden pt-0">
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1 [scrollbar-gutter:stable]">
            <dl className="grid grid-cols-[180px_1fr]">
            {/* 1. Tên sản phẩm */}
            <InfoRow className="border-t-0" label={t("product.detail.info.labelName")}>
              <span className="wrap-break-word font-semibold">{val(product.name)}</span>
            </InfoRow>

            {/* GTIN (VNPC) / SKU (manual) */}
            <InfoRow label={isVnpc ? t("product.detail.info.labelGtin") : t("product.detail.info.labelIdentifier")}>{val(identifierDisplay)}</InfoRow>

            {/* Mã GTIN quốc tế — manual/internal (VNPC already shows GTIN above) */}
            {!isVnpc ? (
              <InfoRow label={t("productCreate.step2.block_1.internationalGTIN")}>
                {val((product.gtin ?? "").trim())}
              </InfoRow>
            ) : null}

            {/* Nhóm hàng quy định — name from GET /product-groups/:id */}
            <InfoRow label={t("productCreate.step2.block_1.productCategoryName")}>
              {val(regulatedGroupDisplay)}
            </InfoRow>

            {/* Phân khúc / Nhóm hàng / Loại hàng / Nhóm cơ sở */}
            <InfoRow label={t("product.detail.info.labelClassification")}>
              {val(classificationValue)}
            </InfoRow>

            {/* Nhãn hiệu */}
            <InfoRow label={t("product.detail.info.labelBrand")}>
              {val(product.brand) !== "—" ? val(product.brand) : findAttr([inter, additional], "brand", "Nhãn hiệu")}
            </InfoRow>

            {/* Xuất xứ */}
            <InfoRow label={t("product.detail.info.labelCountryOfOrigin")}>
              {val(product.country_of_origin)}
            </InfoRow>

            {/* Mô tả */}
            <InfoRow label={t("product.detail.info.labelDescription")} clampable>
              {val(product.description)}
            </InfoRow>

            {/* Nhà cung cấp (tên NCC / trường supplier) */}
            <InfoRow label={t("product.detail.info.labelSupplier")}>{val(supplierNameDisplay)}</InfoRow>

            {/* Doanh nghiệp sở hữu: tên — SĐT — email */}
            <InfoRow label={t("product.detail.info.labelOwnerEnterprise")}>{val(ownerEnterpriseDisplay)}</InfoRow>

            {/* Thị trường mục tiêu */}
            <InfoRow label={t("product.detail.info.labelMarket")}>{val(product.target_market)}</InfoRow>

            {dynamicRows.map((row, idx) => (
              <InfoRow
                key={`attr-row-${idx}`}
                label={row.label}
                preWrap={row.preWrap}
                clampable
              >
                {row.value}
              </InfoRow>
            ))}

            {/* Cập nhật lần cuối */}
            <InfoRow label={t("product.detail.info.labelUpdated")}>
              {formatProductMeta(product)}
            </InfoRow>

            </dl>
          </div>
        </CardContent>
      </Card>

      {/* Right column: QR card + Risk card */}
      <div
        className={cn(
          "flex min-h-0 min-w-0 w-full max-lg:min-h-0 flex-col gap-4 lg:overflow-hidden",
          PRODUCT_INFO_TOP_ROW_LG_SIZE
        )}
      >
        <div className="flex min-h-0 w-full flex-col lg:flex-8 lg:basis-0">
          <ProductQrCard product={product} />
        </div>
        <div className="flex min-h-0 w-full flex-col lg:flex-4 lg:basis-0">
          <ProductRiskCard product={product} />
        </div>
      </div>

      {/* Card — Ảnh sản phẩm (full-width) */}
      <Card className="min-h-32 min-w-0 w-full lg:col-span-3">
        <ProductGallery product={product} />
      </Card>
    </div>
  );
}
