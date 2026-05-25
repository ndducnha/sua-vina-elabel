import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OnChangeFn, RowSelectionState, SortingState } from "@tanstack/react-table";

import { fetchFieldsByAppendixGroup } from "@/api/fields";
import { fetchProductBatchesPage } from "@/api/product-batches";
import {
  type DynamicFilterField,
  type DynamicTableFiltersValuesUpdater,
  type ServerListQuery,
  serverSortToSortingState,
  sortingStateToServer,
} from "@/components/dynamic-table";
import type { AppendixFieldRow } from "@/models/field.model";
import { isManualProduct, parseProductStatus, ProductStatus, type Product } from "@/models/product.model";
import {
  BatchStatus,
  type ProductBatch,
} from "@/models/product-batch.model";
import {
  createBatchInfoColumns,
  type BatchInfoColumnsContext,
} from "../components/batch-info/batchInfoColumns";
import { collectAdditionalAttributeColumnSpecs } from "../utils/batch-table";
import { BATCH_LIST_FILTER_KEYS, createBatchListInitialQuery } from "../utils";

export type UseProductBatchesTableOptions = {
  /** If set, row "Edit" opens the dialog instead of a placeholder toast. */
  onRequestEdit?: (productBatch: ProductBatch) => void;
  /** If set, row "Delete" opens confirmation instead of a placeholder toast. */
  onRequestDelete?: (productBatch: ProductBatch) => void;
  /** If set, row "Download" generates the eLabel landing lot QR PNG instead of a placeholder toast. */
  onRequestDownload?: (productBatch: ProductBatch) => void;
  onRequestPublish?: (productBatch: ProductBatch) => void;
  onRequestRecall?: (productBatch: ProductBatch) => void;
  /** Disables the batch status action icon for the row while a status update is in flight. */
  isBatchStateActionPending?: (batchRowId: string) => boolean;
  /** Used to load lot appendix field definitions (`GET /fields?product_group_id=…&scope=lot`). */
  product?: Product | null;
};

function nextBatchListFilters(
  prev: Record<string, string>,
  update:
    | Record<string, string>
    | ((previousFilters: Record<string, string>) => Record<string, string>)
): Record<string, string> {
  const base = createBatchListInitialQuery().filters;
  const raw = typeof update === "function" ? update(prev) : update;
  return { ...base, ...raw };
}

export function useProductBatchesTable(
  productId: string,
  options?: UseProductBatchesTableOptions
) {
  const { t: translate, i18n } = useTranslation();
  const {
    onRequestEdit,
    onRequestDelete,
    onRequestDownload,
    onRequestPublish,
    onRequestRecall,
    isBatchStateActionPending,
    product,
  } = options ?? {};
  const [query, setQuery] = useState<ServerListQuery>(() => createBatchListInitialQuery());
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const onRowSelectionChange = useCallback<OnChangeFn<RowSelectionState>>((updater) => {
    setRowSelection((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  const clearRowSelection = useCallback(() => {
    setRowSelection({});
  }, []);

  const filterFields = useMemo((): DynamicFilterField[] => {
    return [
      {
        id: BATCH_LIST_FILTER_KEYS.batchCode,
        type: "search",
        filterLabel: translate("product.detail.batch.searchPlaceholder"),
        placeholder: translate("product.detail.batch.searchPlaceholder"),
        debounceMs: 400,
      },
      {
        id: "mfg_date",
        type: "dateRange",
        fromKey: BATCH_LIST_FILTER_KEYS.mfgFrom,
        toKey: BATCH_LIST_FILTER_KEYS.mfgTo,
        filterLabel: translate("product.detail.batch.mfgDate"),
      },
    ];
  }, [translate]);

  const productGroupIdForFields = product?.product_group_id?.trim() ?? "";

  const { data: appendixEnvelope } = useQuery({
    queryKey: ["fields", "product-group", productGroupIdForFields, "lot"],
    queryFn: ({ signal }) =>
      fetchFieldsByAppendixGroup({
        product_group_id: productGroupIdForFields,
        scope: "lot",
        signal,
      }).then((r) => r.data),
    enabled: Boolean(productId?.trim()) && Boolean(productGroupIdForFields),
  });

  const appendixFields: AppendixFieldRow[] = useMemo(() => {
    const raw = appendixEnvelope?.data;
    if (!Array.isArray(raw)) return [];
    return raw.filter((row) => (row.scope ?? "").toLowerCase() === "lot");
  }, [appendixEnvelope?.data]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "product-batches",
      productId,
      query.page,
      query.pageSize,
      query.sort,
      query.filters,
    ],
    queryFn: () => fetchProductBatchesPage(productId, query, filterFields),
    enabled: !!productId?.trim(),
    placeholderData: (previousData) => previousData,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  const selectedBatches = useMemo(() => {
    const selectedIds = new Set(
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id)
    );
    return items.filter((b) => selectedIds.has(b.id));
  }, [items, rowSelection]);

  const additionalAttributeColumns = useMemo(
    () => collectAdditionalAttributeColumnSpecs(items),
    [items]
  );

  const onRowEdit = useCallback(
    (productBatch: ProductBatch) => {
      if (onRequestEdit) {
        onRequestEdit(productBatch);
        return;
      }
      toast.message(translate("product.detail.batch.toast.editTitle"), {
        description: productBatch.batch_code,
      });
    },
    [onRequestEdit, translate]
  );
  const onRowDownload = useCallback(
    (productBatch: ProductBatch) => {
      if (onRequestDownload) {
        onRequestDownload(productBatch);
        return;
      }
      toast.message(translate("product.detail.batch.toast.downloadTitle"), {
        description: productBatch.batch_code,
      });
    },
    [onRequestDownload, translate]
  );
  const onRowPublish = useCallback(
    (productBatch: ProductBatch) => {
      if (onRequestPublish) {
        onRequestPublish(productBatch);
        return;
      }
      toast.message(translate("product.detail.batch.toast.publishTitle"), {
        description: productBatch.batch_code,
      });
    },
    [onRequestPublish, translate]
  );
  const onRowRecall = useCallback(
    (productBatch: ProductBatch) => {
      if (onRequestRecall) {
        onRequestRecall(productBatch);
        return;
      }
      toast.message(translate("product.detail.batch.toast.recallTitle"), {
        description: productBatch.batch_code,
      });
    },
    [onRequestRecall, translate]
  );
  const checkBatchStatePending = useCallback(
    (batchRowId: string) =>
      isBatchStateActionPending ? isBatchStateActionPending(batchRowId) : false,
    [isBatchStateActionPending]
  );
  const onRowDelete = useCallback(
    (productBatch: ProductBatch) => {
      if (onRequestDelete) {
        onRequestDelete(productBatch);
        return;
      }
      toast.message(translate("product.detail.batch.toast.deleteTitle"), {
        description: productBatch.batch_code,
      });
    },
    [onRequestDelete, translate]
  );

  const getBatchStatusLabel = useCallback(
    (status: BatchStatus) => {
      if (status === BatchStatus.RECALLED) return translate("product.detail.batch.statusRecalled");
      if (status === BatchStatus.PUBLISHED) return translate("product.detail.batch.statusPublished");
      return translate("product.detail.batch.statusDraft");
    },
    [translate]
  );

  const productIsManual = useMemo(() => isManualProduct(product), [product]);

  const productStatus = useMemo(
    () =>
      product ? parseProductStatus(product.status) : ProductStatus.PUBLISHED,
    [product],
  );

  const columnContext = useMemo((): BatchInfoColumnsContext => {
    return {
      locale: i18n.language,
      getBatchStatusLabel,
      onRowEdit,
      onRowDownload,
      onRowPublish,
      onRowRecall,
      isBatchStateActionPending: checkBatchStatePending,
      onRowDelete,
      isManualProduct: productIsManual,
      productStatus,
    };
  }, [
    i18n.language,
    getBatchStatusLabel,
    onRowEdit,
    onRowDownload,
    onRowPublish,
    onRowRecall,
    checkBatchStatePending,
    onRowDelete,
    productIsManual,
    productStatus,
  ]);

  const columns = useMemo(
    () =>
      createBatchInfoColumns(translate, columnContext, appendixFields, additionalAttributeColumns),
    [translate, columnContext, appendixFields, additionalAttributeColumns]
  );

  const getRowId = useCallback((productBatch: ProductBatch) => productBatch.id, []);

  const onFilterValuesChange = useCallback(
    (updater: Record<string, string> | DynamicTableFiltersValuesUpdater) => {
      setQuery((q) => ({
        ...q,
        filters: nextBatchListFilters(q.filters, updater),
        page: 1,
      }));
    },
    []
  );

  const onSortingChange: OnChangeFn<SortingState> = useCallback((updater) => {
    setQuery((q) => {
      const prevSorting = serverSortToSortingState(q.sort);
      const nextSorting = typeof updater === "function" ? updater(prevSorting) : updater;
      return {
        ...q,
        sort: sortingStateToServer(nextSorting),
        page: 1,
      };
    });
  }, []);

  const sortingState = useMemo(() => serverSortToSortingState(query.sort), [query.sort]);

  const onPageChange = useCallback((page: number) => {
    setQuery((q) => ({ ...q, page }));
  }, []);

  const onPageSizeChange = useCallback((pageSize: number) => {
    setQuery((q) => ({ ...q, pageSize, page: 1 }));
  }, []);

  const onClearFilters = useCallback(() => {
    setQuery((q) => ({
      ...q,
      filters: createBatchListInitialQuery().filters,
      page: 1,
    }));
  }, []);

  return {
    query,
    isFetching,
    items,
    total,
    appendixFields,
    additionalAttributeColumns,
    columns,
    filterFields,
    sortingState,
    onFilterValuesChange,
    onClearFilters,
    onSortingChange,
    onPageChange,
    onPageSizeChange,
    getRowId,
    rowSelection,
    onRowSelectionChange,
    selectedBatches,
    clearRowSelection,
  };
}

export type ProductBatchesTableViewModel = ReturnType<typeof useProductBatchesTable>;
