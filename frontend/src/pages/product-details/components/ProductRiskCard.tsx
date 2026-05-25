import { AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { Product } from "@/models/product.model";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getRiskBadge } from "../utils/product-risk-badge";

type Props = {
  product: Product;
};

export function ProductRiskCard({ product }: Props) {
  const { t } = useTranslation();
  const riskBadge = getRiskBadge(t, product.risk_level);

  return (
    <Card className="w-full shrink-0 overflow-hidden lg:flex lg:h-full lg:min-h-0 lg:flex-1 lg:flex-col">
      <CardHeader className="shrink-0 border-b pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="size-5 shrink-0 text-primary"
            aria-hidden
          />
          <CardTitle className="font-semibold text-primary">
            {t("product.detail.riskCard.title")}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background p-0 lg:min-h-0">
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pt-1.5 pb-4">
        {riskBadge ? (
          <span
            className={cn(
              "inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium",
              riskBadge.cls,
            )}
          >
            {riskBadge.label}
          </span>
        ) : null}
        <p className="text-muted-foreground text-xs leading-relaxed">
          {t("product.detail.riskCard.regulationStatic")}
        </p>
        </div>
      </CardContent>
    </Card>
  );
}
