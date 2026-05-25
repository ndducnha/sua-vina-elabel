import { useEffect, useState } from "react";
import { Download, Eye, QrCode } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Product } from "@/models/product.model";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  downloadProductQrPng,
  renderProductQrPreview,
  resolveProductQrPayload,
} from "../utils/product-qr";
import { parseProductStatus, ProductStatus } from "@/models/product.model";

type Props = {
  product: Product;
};

/** Warning label based on product state (FR3). */
function QrStateWarning({ status }: { status: string }) {
  const parsed = parseProductStatus(status);

  if (parsed === ProductStatus.DRAFT) {
    return (
      <p className="text-warning flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
        ⚠ QR chưa kích hoạt — cần xuất bản trước
      </p>
    );
  }

  if (parsed === ProductStatus.RECALLED) {
    return (
      <p className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
        ⚠ QR dẫn đến trang sản phẩm đã thu hồi
      </p>
    );
  }

  return null; // Published → no warning
}

export function ProductQrCard({ product }: Props) {
  const { t } = useTranslation();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const taxCode = product.tax_code;
  const gtin = product.gtin;
  const sku = product.sku;
  const payloadUrl = resolveProductQrPayload({ taxCode, gtin, sku });
  const hasFullQrInfo = Boolean(payloadUrl);

  // Render preview immediately when URL can be resolved (no lazy-loading — AC1 / NFR)
  useEffect(() => {
    let cancelled = false;
    if (!hasFullQrInfo) {
      setPreviewUrl(null);
      return () => {
        cancelled = true;
      };
    }
    void renderProductQrPreview({ taxCode, gtin, sku })
      .then((dataUrl) => {
        if (!cancelled) setPreviewUrl(dataUrl);
      })
      .catch((err) => {
        console.warn("[ProductQrCard] QR preview failed:", err);
        if (!cancelled) setPreviewUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [hasFullQrInfo, taxCode, gtin, sku]);

  async function handleDownload() {
    setIsDownloading(true);
    try {
      await downloadProductQrPng({ taxCode: product.tax_code, gtin: product.gtin, sku: product.sku });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card
      className="w-full shrink-0 overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col"
    >
      <CardHeader className="shrink-0 border-b pb-3">
        <div className="flex items-center gap-2">
          <QrCode className="text-primary size-5 shrink-0" aria-hidden />
          <CardTitle className="font-semibold text-primary">
            {t("product.detail.qr.title")}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden p-0 lg:min-h-0">
        <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-x-hidden overflow-y-auto px-4">
        {/* QR Preview 130×130 (AC1) */}
        <div className="flex size-[130px] items-center justify-center">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="QR sản phẩm"
              width={200}
              draggable={false}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div
              className={cn(
                "size-full rounded border border-dashed border-border bg-muted/50",
                hasFullQrInfo && "animate-pulse",
              )}
              aria-hidden
            />
          )}
        </div>

        {/* State-aware warning (FR3) */}
        <QrStateWarning status={product.status} />

        {/* Instructional note (FR1) */}
        <p className="text-muted-foreground text-center text-xs">
          {t("product.detail.qr.hint")}
        </p>

        {/* Open landing label viewer */}
        {payloadUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-auto min-h-7 w-full gap-2 whitespace-normal border-foreground/20 wrap-break-word py-1.5"
            onClick={() => {
              const a = document.createElement("a");
              a.href = payloadUrl;
              a.target = "_blank";
              a.rel = "noopener noreferrer";
              document.body.appendChild(a);
              a.click();
              a.remove();
            }}
          >
            <Eye className="size-4 shrink-0" aria-hidden />
            {t("product.detail.viewElectronicLabel")}
          </Button>
        ) : (
          <div className="w-full rounded-md border border-border bg-muted/40 px-3 py-1.5 text-center text-xs text-muted-foreground">
            {t("product.detail.qr.insufficientInfo")}
          </div>
        )}

        {/* Download button (FR4 / AC4) */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleDownload}
          disabled={isDownloading || !hasFullQrInfo}
        >
          <Download className="size-4" />
          {isDownloading ? "Đang tạo…" : t("product.detail.qr.download")}
        </Button>
        </div>
      </CardContent>
    </Card>
  );
}
