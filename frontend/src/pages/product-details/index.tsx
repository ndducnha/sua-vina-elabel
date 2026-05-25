import { ChevronRight, Loader2, Menu, Pencil, Trash2, TriangleAlert } from "lucide-react";
import { isAxiosError } from "axios";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";

import { deleteProduct, updateProductStatus } from "@/api/product";
import { Badge } from "@/components/ui/badge";
import { messageDialogService } from "@/components/dialog/messageDialog";
import { ProductStatus } from "@/models/product.model";
import { toast } from "sonner";
import { BatchInfo } from "./components/BatchInfo";
import { ProductInfo } from "./components/ProductInfo";
import { RecallDialog } from "./components/RecallDialog";
import { useProductDetail, PRODUCT_DETAIL_QUERY_KEY } from "./hooks/useProductDetail";

type ProductDetailsLocationState = {
  name?: string;
};

export function ProductDetailsPage() {
  const { t } = useTranslation();
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const location = useLocation();
  const state = location.state as ProductDetailsLocationState | null;
  const [isRecallDialogOpen, setIsRecallDialogOpen] = useState(false);
  const [isUpdateStatusLoading, setIsUpdateStatusLoading] = useState(false);

  const { data: product, isPending, isError, refetch, isFetching } = useProductDetail(productId);
  const onUpdateProductStatus = async (status: ProductStatus, reason?: string) => {
    if (!product) return;
    try {
      setIsUpdateStatusLoading(true);
      const res = await updateProductStatus({ productId: product.id, status, reason });
      if (res.status === 200) {
        toast.success(t("product.detail.updateStatusSuccess"));
        setIsRecallDialogOpen(false);
        refetch();
        void queryClient.invalidateQueries({ queryKey: ["products"] });
      } else {
        toast.error(t("product.detail.updateStatusError"));
      }
    } catch (error) {
      console.error("Failed to update product status", error);
    }
    finally {
      setIsUpdateStatusLoading(false);
    }
  };

  const openDeleteProductConfirmDialog = () => {
    if (!product) return;
    const id = product.id;
    messageDialogService.open({
      context: "warning",
      title: t("product.detail.deleteProductTitle"),
      message: t("product.detail.deleteProductDescription"),
      cancelText: t("common.cancel"),
      confirmButton: {
        text: t("common.delete"),
        onSubmit: async () => {
          try {
            const res = await deleteProduct(id);
            const deletedOk = res.data?.data?.deleted !== false;
            if (res.status !== 200 || !deletedOk) {
              toast.error(t("product.detail.deleteProductError"));
              throw new Error("delete failed");
            }
            toast.success(t("product.detail.deleteProductSuccess"));
            await queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.removeQueries({ queryKey: [PRODUCT_DETAIL_QUERY_KEY, id] });
            navigate("/products");
          } catch (error) {
            if (!(error instanceof Error) || error.message !== "delete failed") {
              if (isAxiosError(error) && error.response?.status === 404) {
                toast.error(t("product.detail.deleteProductNotFound"));
              } else {
                const data = isAxiosError(error)
                  ? (error.response?.data as { message?: string } | undefined)
                  : undefined;
                const apiMsg = typeof data?.message === "string" ? data.message.trim() : "";
                toast.error(apiMsg || t("product.detail.deleteProductError"));
              }
            }
            throw error;
          }
        },
      },
    });
  };

  if (!productId?.trim()) {
    return <div className="text-muted-foreground border-border rounded-lg border px-4 py-8 text-center text-sm">{t("product.detail.loadError")}</div>;
  }

  if (isPending) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="size-8 animate-spin" aria-hidden />
        <p className="text-sm">{t("product.detail.loading")}</p>
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="border-destructive/30 bg-destructive/5 flex max-w-lg flex-col gap-3 rounded-lg border px-4 py-6 text-sm">
        <p className="text-foreground">{t("product.detail.loadError")}</p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="size-4 animate-spin" /> : null}
            <span>{t("product.detail.retry")}</span>
          </Button>
          <Link to="/products" className="text-primary hover:underline text-sm font-medium">
            {t("product.detail.breadcrumbList")}
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    product.name?.trim() || state?.name?.trim() || productId?.trim() || t("product.detail.nameFallback");

  return (
    <div>
      <header className="border-border/60 -mx-6 -mt-6 mb-2 flex flex-col gap-4 bg-muted/40 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm" aria-label="Breadcrumb">
          <Menu className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <Link to="/products" className="text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            {t("product.detail.breadcrumbList")}
          </Link>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" aria-hidden />
          <div className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <span className="text-foreground min-w-0 font-medium truncate inline-block max-w-[160px] align-bottom" title={displayName}>
              {displayName}
            </span>
            <Badge
              className="shrink-0"
              variant={
                product.status === ProductStatus.PUBLISHED
                  ? "success"
                  : product.status === ProductStatus.DRAFT
                    ? "ghost"
                    : "error"
              }
            >
              <p className="mr-0.5">•</p>
              {t(`product.status.${product.status}`)}
            </Badge>
          </div>
        </nav>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {product.status === ProductStatus.DRAFT && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="gap-1.5 p-4 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
              onClick={openDeleteProductConfirmDialog}
            >
              <Trash2 className="size-4" />
              {t("common.delete")}
            </Button>
          )}

          {/* EDIT BUTTON */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 p-4 hover:bg-gray-200"
            onClick={() => navigate(`/products/${product.id}/edit`)}
          >
            <Pencil className="size-4" />
            {t("common.edit")}
          </Button>

          {/* PUBLISH BUTTON */}
          {(product.status === ProductStatus.DRAFT || product.status === ProductStatus.RECALLED) && (
            <Button type="button" size="sm" className="p-4 bg-primary text-white" onClick={() => onUpdateProductStatus("published")} disabled={isUpdateStatusLoading}>
              {t("product.detail.publish")}
            </Button>
          )}
          {product.status === ProductStatus.PUBLISHED && (
            <Button type="button" size="sm" className="p-4" onClick={() => setIsRecallDialogOpen(true)} disabled={isUpdateStatusLoading}>
              {t("product.detail.recall")}
            </Button>
          )}

        </div>
      </header>
      {product.status === ProductStatus.RECALLED && (
        <div className="mb-4 flex justify-between">
          <div className="flex gap-2">
            <TriangleAlert className="size-4 text-red-500" />
            <p className="text-warning text-sm">{t("product.detail.recallWarning")} "{product.recall_reason}"</p>
          </div>
          <Button variant="ghost" size="sm" className={"border border-yellow-400 hover:border-yellow-500"} onClick={() => setIsRecallDialogOpen(true)} disabled={isFetching}><Pencil className="size-4" />{t("product.detail.editReasonButton")}</Button>
        </div>
      )}
      <div className="mb-4">
        <ProductInfo product={product} />
      </div>

      <div className="mb-4 relative">
        <BatchInfo product={product} />
      </div>

      <RecallDialog open={isRecallDialogOpen} onOpenChange={setIsRecallDialogOpen} product={product} onSave={onUpdateProductStatus} />
    </div>
  );
}
