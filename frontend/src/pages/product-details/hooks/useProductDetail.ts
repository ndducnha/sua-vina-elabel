import { useQuery } from "@tanstack/react-query";

import { fetchProductById } from "@/api/product";

export const PRODUCT_DETAIL_QUERY_KEY = "product-detail" as const;

export function useProductDetail(productId: string | undefined) {
  return useQuery({
    queryKey: [PRODUCT_DETAIL_QUERY_KEY, productId],
    queryFn: async () => {
      const res = await fetchProductById(productId!);
      return res.data.data;
    },
    enabled: Boolean(productId?.trim()),
  });
}
