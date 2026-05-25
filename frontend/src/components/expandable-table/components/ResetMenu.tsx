import { useTranslation } from "react-i18next";
import { ChevronDown, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type ResetMenuProps = {
  canResetAllData: boolean;
  canRemoveAddedColumns: boolean;
  canRemoveAddedRows: boolean;
  onResetAllTableData: () => void;
  onResetAllAddedColumns: () => void;
  onResetAllAddedRows: () => void;
};

export function ResetMenu({
  canResetAllData,
  canRemoveAddedColumns,
  canRemoveAddedRows,
  onResetAllTableData,
  onResetAllAddedColumns,
  onResetAllAddedRows,
}: ResetMenuProps) {
  const { t } = useTranslation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className="inline-flex items-center gap-2 px-4"
          >
            <RotateCcw className="size-4 shrink-0" aria-hidden />
            {t("expandableTable.resetMenuButtonLabel")}
            <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="start" className="min-w-56">
        <DropdownMenuItem disabled={!canResetAllData} onClick={onResetAllTableData}>
          {t("expandableTable.resetAllDataItemLabel")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!canRemoveAddedColumns}
          onClick={onResetAllAddedColumns}
        >
          {t("expandableTable.resetAllAddedColumnsItemLabel")}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!canRemoveAddedRows} onClick={onResetAllAddedRows}>
          {t("expandableTable.resetAllAddedRowsItemLabel")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
