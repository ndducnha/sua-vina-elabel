import { useQuery } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { OnChangeFn, SortingState } from "@tanstack/react-table";

import { fetchProductGroups } from "@/api/product";
import { UserMode, UserRole } from "@/models/auth.model";
import type { Product } from "@/models/product.model";
import { useAuthStore } from "@/stores/auth.store";
import {
  type DynamicFilterField,
  type DynamicTableFiltersValuesUpdater,
  type ServerListQuery,
  serverSortToSortingState,
  sortingStateToServer,
} from "@/components/dynamic-table";

import { ProductStatus } from "@/models/product.model";

import { createProductColumns } from "../components/productColumns";
import {
  createProductListInitialQuery,
  fetchProductsPage,
  PRODUCT_LIST_FILTER_KEYS,
} from "../utils";

export function useProductList() {
  const { t: translate, i18n } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const viewerRole = user?.role ?? UserRole.USER;
  const userMode = user?.mode ?? UserMode.VNPC;

  const [serverListQuery, setServerListQuery] = useState<ServerListQuery>(() =>
    createProductListInitialQuery()
  );

  const { data: productGroupsEnvelope } = useQuery({
    queryKey: ["product-groups"],
    queryFn: () => fetchProductGroups().then((response) => response.data),
    staleTime: 5 * 60_000,
  });

  const productGroupOptions = useMemo(
    () =>
      (productGroupsEnvelope?.data ?? []).map((productGroup) => ({
        value: productGroup.id,
        label: productGroup.name,
      })),
    [productGroupsEnvelope?.data]
  );

  const filterFields = useMemo((): DynamicFilterField[] => {
    const searchTextFilterKey = PRODUCT_LIST_FILTER_KEYS.q;
    const warningFilterKey = PRODUCT_LIST_FILTER_KEYS.warning;
    const statusesFilterKey = PRODUCT_LIST_FILTER_KEYS.status;
    const productGroupIdsFilterKey = PRODUCT_LIST_FILTER_KEYS.product_group_id;

    return [
      {
        id: searchTextFilterKey,
        type: "search",
        filterLabel: translate("product.filters.searchLabel"),
        placeholder: translate("product.filters.searchPlaceholder"),
        debounceMs: 400,
      },
      {
        id: warningFilterKey,
        type: "select",
        filterLabel: translate("product.filters.warningLabel"),
        omitSelectValues: ["all"],
        hideChip: true,
        options: [
          { value: "all", label: translate("product.filters.warningAll") },
          { value: "has_warning", label: translate("product.filters.warningHas") },
          { value: "no_warning", label: translate("product.filters.warningNone") },
        ],
      },
      {
        id: statusesFilterKey,
        type: "multiselect",
        filterLabel: translate("product.filters.statusLabel"),
        emptySummary: translate("product.filters.statusAll"),
        menuContentClassName: "min-w-48",
        options: [
          { value: ProductStatus.DRAFT, label: translate("product.status.draft") },
          { value: ProductStatus.PUBLISHED, label: translate("product.status.published") },
          { value: ProductStatus.RECALLED, label: translate("product.status.recalled") },
        ],
      },
      {
        id: productGroupIdsFilterKey,
        type: "multiselect",
        filterLabel: translate("product.filters.categoryLabel"),
        emptySummary: translate("product.filters.categoryAll"),
        menuContentClassName: "min-w-56 max-h-72 overflow-y-auto",
        options: productGroupOptions,
      },
    ];
  }, [translate, productGroupOptions]);

  const onViewBusiness = useCallback((enterpriseId: string, enterpriseName: string) => {
    toast.message(translate("product.toast.viewBusinessTitle"), {
      description: translate("product.toast.viewBusinessDescription", {
        name: enterpriseName,
        id: enterpriseId,
      }),
    });
  }, [translate]);

  const { data: productsPagedResult, isFetching } = useQuery({
    queryKey: [
      "products",
      serverListQuery.page,
      serverListQuery.pageSize,
      serverListQuery.sort,
      serverListQuery.filters,
    ],
    queryFn: () => fetchProductsPage(serverListQuery, filterFields),
    placeholderData: (previousData) => previousData,
  });

  const items = productsPagedResult?.items ?? [];
  const total = productsPagedResult?.total ?? 0;
  const summary = productsPagedResult?.summary ?? null;

  const columns = useMemo(
    () =>
      createProductColumns(translate, {
        locale: i18n.language,
        onViewBusiness,
        viewerRole,
        userMode,
      }),
    [translate, i18n.language, onViewBusiness, viewerRole, userMode]
  );

  const getRowId = useCallback((row: Product) => row.id, []);

  const sortingState = serverSortToSortingState(serverListQuery.sort);

  const onFilterValuesChange = useCallback(
    (filtersOrUpdater: Record<string, string> | DynamicTableFiltersValuesUpdater) => {
      setServerListQuery((previousListQuery) => ({
        ...previousListQuery,
        filters:
          typeof filtersOrUpdater === "function"
            ? filtersOrUpdater(previousListQuery.filters)
            : filtersOrUpdater,
        page: 1,
      }));
    },
    []
  );

  const onSortingChange: OnChangeFn<SortingState> = useCallback((sortingStateUpdater) => {
    setServerListQuery((previousListQuery) => {
      const previousSortingState = serverSortToSortingState(previousListQuery.sort);
      const nextSortingState =
        typeof sortingStateUpdater === "function"
          ? sortingStateUpdater(previousSortingState)
          : sortingStateUpdater;
      return {
        ...previousListQuery,
        sort: sortingStateToServer(nextSortingState),
        page: 1,
      };
    });
  }, []);

  const onPageChange = useCallback((page: number) => {
    setServerListQuery((q) => ({ ...q, page }));
  }, []);

  const onPageSizeChange = useCallback((pageSize: number) => {
    setServerListQuery((q) => ({ ...q, pageSize, page: 1 }));
  }, []);

  return {
    query: serverListQuery,
    isFetching,
    items,
    total,
    summary,
    userMode,
    columns,
    filterFields,
    sortingState,
    onFilterValuesChange,
    onSortingChange,
    onPageChange,
    onPageSizeChange,
    getRowId,
  };
}
