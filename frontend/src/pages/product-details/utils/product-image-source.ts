import { PRODUCT_IMAGE_SOURCE_ELABEL, type ProductImage } from "@/models/product.model";

export function isProductImageSourceElabel(source: string | null | undefined): boolean {
  return (source ?? "").trim().toLowerCase() === PRODUCT_IMAGE_SOURCE_ELABEL;
}

/**
 * VNPC / external images first; user (`elabel`) images after, preserving order within each group.
 */
export function sortProductGalleryImages(images: ProductImage[]): ProductImage[] {
  const external: ProductImage[] = [];
  const user: ProductImage[] = [];
  for (const img of images) {
    if (isProductImageSourceElabel(img.source)) user.push(img);
    else external.push(img);
  }
  return [...external, ...user];
}