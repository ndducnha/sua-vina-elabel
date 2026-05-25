import { ChevronDown } from "lucide-react";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  DynamicDataTable,
  DynamicTableFilters,
  DynamicTableMobileSort,
  DynamicTablePageLayout,
  DynamicTableSummaryBar,
  TablePagination,
} from "@/components/dynamic-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useProductList } from "../hooks/useProductList";
import { getProductMobileSortColumns } from "../utils/product-list.sort";
import { buildProductSummaryBarItems } from "../utils/product-list.summary";
import { useNavigate } from "react-router";
import { useAuthStore } from "@/stores/auth.store";
import { UserMode } from "@/models/auth.model";

const ProductAddDropdown = memo(function ProductAddDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const handleDirectEntry = () => {
    if (user?.mode === UserMode.VNPC) {
      navigate("/product-create");
    } else if (user?.mode === UserMode.INTERNAL) {
      navigate("/product-create-secondary-label");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button type="button" className="gap-1.5">
            {t("product.addProduct.trigger")}
            <ChevronDown className="size-4 opacity-80" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <DropdownMenuItem onClick={handleDirectEntry}>{t("product.addProduct.directEntry")}</DropdownMenuItem>
        <DropdownMenuItem disabled>{t("product.addProduct.fromFile")}</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
});

export function ProductListView() {
  const { t: translate } = useTranslation();
  const {
    query,
    isFetching,
    items,
    total,
    columns,
    filterFields,
    sortingState,
    onFilterValuesChange,
    onSortingChange,
    onPageChange,
    onPageSizeChange,
    summary,
    getRowId,
    userMode,
  } = useProductList();

  const productSummaryItems = useMemo(
    () => buildProductSummaryBarItems(summary, total, translate),
    [summary, total, translate]
  );

  const mobileSortColumns = useMemo(
    () => getProductMobileSortColumns(translate, userMode),
    [translate, userMode]
  );

  return (
    <DynamicTablePageLayout
      title={translate("product.pageTitle")}
      subtitle={translate("product.pageSubtitle")}
      headerEnd={<ProductAddDropdown />}
    >
      <DynamicTableFilters
        fields={filterFields}
        values={query.filters}
        onValuesChange={onFilterValuesChange}
        showSubmitButton={false}
        className="[&_select]:h-9 [&_select]:min-h-9"
        accessory={
          <div className="w-full md:hidden">
            <DynamicTableMobileSort
              idPrefix="product-list"
              sorting={sortingState}
              onSortingChange={onSortingChange}
              sortableColumns={mobileSortColumns}
              disabled={isFetching}
              labels={{
                ascending: translate("product.sort.ascending"),
                descending: translate("product.sort.descending"),
                fieldAriaLabel: translate("product.filters.sortFieldLabel"),
                directionAriaLabel: translate("product.filters.sortDirectionLabel"),
              }}
            />
          </div>
        }
      />
      <DynamicTableSummaryBar
        items={productSummaryItems}
        aria-label={translate("product.summary.regionLabel")}
      />
      <DynamicDataTable
        data={items}
        columns={columns}
        sorting={sortingState}
        onSortingChange={onSortingChange}
        getRowId={getRowId}
        isLoading={isFetching}
        loadingLabel={translate("common.loading")}
        emptyLabel={translate("common.noData")}
        className="min-w-6xl"
      />

      <TablePagination
        page={query.page}
        pageSize={query.pageSize}
        total={total}
        disabled={isFetching}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </DynamicTablePageLayout>
  );
}
