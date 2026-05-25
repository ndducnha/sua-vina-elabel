import { useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Plus, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";
import { toast } from "sonner";

import { updateProduct } from "@/api/product";
import { messageDialogService } from "@/components/dialog/messageDialog";
import { Badge } from "@/components/ui/badge";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PRODUCT_IMAGE_SOURCE_ELABEL,
  type Product,
  type ProductImage,
} from "@/models/product.model";
import {
  isProductImageSourceElabel,
  sortProductGalleryImages,
} from "@/pages/product-details/utils/product-image-source";
import { PRODUCT_DETAIL_QUERY_KEY } from "@/pages/product-details/hooks/useProductDetail";
import {
  AddImageDialog,
  type AddImagePayload,
} from "@/pages/product-details/components/AddImageDialog";
import { PreviewGallery } from "@/components/preview-gallery";
import { Button } from "@/components/ui/button";

type ProductGalleryProps = {
  product: Product;
};

export function ProductGallery({ product }: ProductGalleryProps) {
  const { productId: routeProductId } = useParams<{ productId: string }>();
  const detailCacheId = routeProductId?.trim() || product.id;
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [saveAddLoading, setSaveAddLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  const rawImages = product.images ?? [];
  const galleryImages = useMemo(() => sortProductGalleryImages(rawImages), [rawImages]);
  const total = galleryImages.length;

  const previewImages = useMemo(
    () =>
      galleryImages.map((img) => ({
        src: img.url,
        alt: img.note?.trim() || undefined,
      })),
    [galleryImages],
  );

  const openPreview = useCallback((index: number) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  }, []);

  const patchImages = useCallback(
    async (nextImages: ProductImage[]) => {
      const res = await updateProduct({
        productId: product.id,
        data: { images: nextImages },
      });
      if (res.status < 200 || res.status >= 300) {
        throw new Error(res.data.message ?? "PATCH failed");
      }
      if (res.data.status !== 200) {
        throw new Error(res.data.message ?? "PATCH failed");
      }

      const next = res.data.data;
      if (next == null) {
        await queryClient.invalidateQueries({
          queryKey: [PRODUCT_DETAIL_QUERY_KEY, detailCacheId],
        });
        return;
      }

      queryClient.setQueryData<Product>(
        [PRODUCT_DETAIL_QUERY_KEY, detailCacheId],
        (old) =>
          old
            ? {
                ...old,
                images: next.images,
                updated_at: next.updated_at,
                version: next.version,
              }
            : old,
      );
    },
    [detailCacheId, product.id, queryClient],
  );

  const openAddModal = useCallback(() => {
    setAddOpen(true);
  }, []);

  const handleSaveAddedImage = useCallback(
    async ({ url, note }: AddImagePayload) => {
      setSaveAddLoading(true);
      try {
        const next: ProductImage[] = [
          ...sortProductGalleryImages(product.images ?? []),
          {
            url,
            note,
            source: PRODUCT_IMAGE_SOURCE_ELABEL,
          },
        ];
        await patchImages(next);
        toast.success(t("product.detail.images.patchSuccess"));
        setAddOpen(false);
      } catch {
        toast.error(t("common.error"));
      } finally {
        setSaveAddLoading(false);
      }
    },
    [patchImages, product.images, t],
  );

  const requestDeleteAtIndex = useCallback(
    (index: number) => {
      messageDialogService.open({
        context: "warning",
        title: t("product.detail.images.deleteConfirmTitle"),
        message: <p>{t("product.detail.images.deleteConfirmBody")}</p>,
        cancelText: t("common.cancel"),
        confirmButton: {
          text: t("common.delete"),
          onSubmit: async () => {
            try {
              const sorted = sortProductGalleryImages(product.images ?? []);
              const next = sorted.filter((_, i) => i !== index);
              await patchImages(next);
              toast.success(t("product.detail.images.patchSuccess"));
            } catch {
              toast.error(t("common.error"));
              throw new Error("patch images failed");
            }
          },
        },
      });
    },
    [patchImages, product.images, t],
  );

  return (
    <>
      <CardHeader className="shrink-0 border-b pb-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <ImageIcon className="text-primary size-5 shrink-0" aria-hidden />
            <CardTitle className="font-semibold text-primary">
              {t("product.detail.images.title")}
            </CardTitle>
            <Badge
              variant="secondary"
              className="border border-purple-200 shrink-0 bg-purple-50 font-medium text-purple-500 dark:bg-purple-950 dark:text-purple-100"
            >
              {t("product.detail.images.count", { count: total })}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <div className="text-muted-foreground flex max-w-xl flex-wrap items-center gap-2 text-xs">
              <Badge className="bg-secondary text-white rounded-sm pt-1">
                {t("product.detail.images.vnpcBadge")}
              </Badge>
              <span>{t("product.detail.images.vnpcLegend")}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-w-0">
        <div className="flex gap-3 overflow-x-auto scroll-smooth pb-1 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]">
          {galleryImages.map((img, index) => {
            const isAddedByUser = isProductImageSourceElabel(img.source);
            const note = img.note?.trim();
            const thumb = (
              <div className="relative flex h-[100px] w-[140px] shrink-0 snap-start">
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={t("product.detail.images.previewGalleryOpenAria", {
                    current: index + 1,
                    total: galleryImages.length,
                  })}
                  className="border-border group relative flex size-full cursor-pointer flex-col justify-center overflow-hidden rounded-md border bg-muted p-0.5 outline-none hover:opacity-[0.98] focus-visible:ring-2 focus-visible:ring-purple-400/70"
                  onClick={() => openPreview(index)}
                  onKeyDown={(e) => {
                    if (e.target !== e.currentTarget) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openPreview(index);
                    }
                  }}
                >
                  <img
                    src={img.url}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                    loading="lazy"
                  />
                  <div className="pointer-events-none absolute inset-0 z-10 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                    <div className="absolute inset-0 bg-black/60" />
                    <div className="relative flex h-full flex-col p-1">
                      <div className="min-h-7" aria-hidden />
                      <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden px-1">
                        {note ? (
                          <Tooltip>
                            <TooltipTrigger className="pointer-events-auto block min-w-0 w-full border-0 bg-transparent p-0 text-center">
                              <p className="line-clamp-3 max-w-full text-center text-xs leading-snug wrap-break-word text-white">
                                {note}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent side="bottom" sideOffset={6} className="max-w-[min(280px,85vw)]">
                              <p className="text-xs whitespace-pre-wrap">{note}</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`absolute bottom-1 left-1 z-20 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white shadow ${
                      isAddedByUser ? "bg-emerald-600" : "bg-blue-600"
                    }`}
                  >
                    {isAddedByUser ? t("product.detail.images.sourceAdded") : t("product.detail.images.vnpcBadge")}
                  </span>
                </div>
                {isAddedByUser ? (
                  <button
                    type="button"
                    className="text-destructive-foreground hover:bg-destructive/90 focus-visible:ring-ring absolute top-1 right-1 z-30 cursor-pointer rounded-full p-1 focus-visible:ring-2 focus-visible:outline-none"
                    aria-label={t("product.detail.images.deleteImageAria")}
                    onClick={(e) => {
                      e.stopPropagation();
                      requestDeleteAtIndex(index);
                    }}
                  >
                    <X className="size-3" aria-hidden />
                  </button>
                ) : null}
              </div>
            );

            return (
              <div key={`${img.url}-${index}-${img.source}`} className="shrink-0 snap-start">
                {isAddedByUser ? (
                  thumb
                ) : (
                  <Tooltip>
                    <TooltipTrigger className="border-0 bg-transparent p-0">
                      {thumb}
                    </TooltipTrigger>
                    <TooltipContent side="top">{t("product.detail.images.vnpcTooltip")}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })}

          <Button
            type="button"
            onClick={openAddModal}
            className="border-border text-muted-foreground hover:bg-primary/10 hover:text-primary flex h-[100px] w-[140px] shrink-0 snap-start flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-transparent transition-colors"
          >
            <Plus className="size-6" aria-hidden />
            <span className="text-xs font-medium">{t("product.detail.images.add")}</span>
          </Button>
        </div>
      </CardContent>

      <AddImageDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        isSaving={saveAddLoading}
        onSave={handleSaveAddedImage}
      />

      <PreviewGallery
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        images={previewImages}
        initialIndex={previewIndex}
        labels={{
          close: t("product.detail.images.previewGalleryClose"),
          previous: t("product.detail.images.previewGalleryPrev"),
          next: t("product.detail.images.previewGalleryNext"),
          dialogTitle: t("product.detail.images.previewGallerySrTitle"),
        }}
      />
    </>
  );
}
