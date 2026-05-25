import { memo, useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableHead, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  permanentDataColumnLeft,
  resolveColumnMinWidthPx,
  resolveLastLeftStickyEdgeKey,
  STICKY_LEFT_STACK_OUTER_SHADOW,
  STICKY_RIGHT_STACK_OUTER_SHADOW,
  stickyIndexCellStyle,
} from "../utils/stickyColumns";
import { resolveExpandableTableHeaderText } from "../utils/headerLabelText";
import { HeaderChip } from "./HeaderChip";
import type { ExpandableTableViewProps } from "./types";

type HeaderRowProps = Pick<
  ExpandableTableViewProps,
  | "tableColumns"
  | "validation"
  | "showIndexColumn"
  | "addColumnButtonText"
  | "headerInputPlaceholder"
  | "indexColumnLabel"
  | "removeColumnTooltip"
  | "onAppendColumn"
  | "onRemoveColumnByKey"
  | "onSetColumnHeader"
  | "isReadOnly"
  | "locale"
> & {
  /** `headerRowValidationSignature(validation)` from parent; avoids re-rendering on body-only validation churn. */
  headerValidationSig: string;
};

/**
 * Renders the header string; when `required` is true, shows a red trailing `*`
 * and strips a literal trailing ` *` from the string if present.
 */
function ExpandableTableColumnHeaderText({
  header,
  required,
}: {
  header: string;
  required: boolean;
}): ReactNode {
  if (!required) {
    return header;
  }
  const withoutTrailingStar = header.replace(/\s*\*\s*$/, "").trim();
  return (
    <>
      {withoutTrailingStar}
      <span className="ml-0.5 text-destructive" aria-hidden>
        *
      </span>
    </>
  );
}

function TableHeaderRowInner({
  tableColumns,
  validation,
  headerValidationSig,
  showIndexColumn,
  addColumnButtonText,
  headerInputPlaceholder,
  indexColumnLabel,
  removeColumnTooltip,
  locale,
  onAppendColumn,
  onRemoveColumnByKey,
  onSetColumnHeader,
  isReadOnly = false,
}: HeaderRowProps) {
  const { t } = useTranslation();
  void headerValidationSig;
  const lastLeftStickyEdgeKey = useMemo(
    () => resolveLastLeftStickyEdgeKey(tableColumns, showIndexColumn),
    [tableColumns, showIndexColumn],
  );
  const permanentBeforeByColIndex = useMemo(
    () =>
      tableColumns.map((_, i) =>
        tableColumns.slice(0, i).filter((c) => c.permanent).length
      ),
    [tableColumns]
  );
  const addColumnHeaderCellClassName = cn(
    "h-10 w-[130px] px-0 align-middle",
    "sticky right-0 z-40 bg-[#F7F8FC]",
    STICKY_RIGHT_STACK_OUTER_SHADOW,
  );

  return (
    <TableRow className="hover:bg-transparent">
      {showIndexColumn && (
        <TableHead
          style={stickyIndexCellStyle}
          className={cn(
            "h-10 px-3 align-middle text-center text-sm font-medium",
            "sticky left-0 z-30 bg-[#F7F8FC]",
            lastLeftStickyEdgeKey === "index" && STICKY_LEFT_STACK_OUTER_SHADOW,
          )}
        >
          {indexColumnLabel}
        </TableHead>
      )}
      {tableColumns.map((column, colIndex) => {
        const sticky = column.permanent;
        const left = sticky
          ? permanentDataColumnLeft(
              showIndexColumn,
              permanentBeforeByColIndex[colIndex] ?? 0
            )
          : undefined;

        const headerError = validation.headerErrorByKey[column.key];
        const headerInvalid = Boolean(headerError);

        const headerLabel = column.removable && !isReadOnly ? (
          <div className="flex min-w-0 flex-1 items-center gap-0.5">
            <Input
              value={column.header}
              onChange={(event) => onSetColumnHeader(column.key, event.target.value)}
              required={column.required}
              aria-invalid={headerInvalid}
              placeholder={headerInputPlaceholder}
              className={cn(
                "h-7 min-w-0 flex-1 border border-input bg-background placeholder:text-muted-foreground",
                headerInvalid && "border-destructive ring-1 ring-destructive",
              )}
              aria-label={`Column header ${column.key}`}
            />
            {column.required ? (
              <span className="shrink-0 text-destructive" aria-hidden>
                *
              </span>
            ) : null}
          </div>
        ) : (
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="block min-w-0 flex-1 truncate text-left text-sm font-medium leading-snug"
              aria-invalid={headerInvalid}
            >
              <ExpandableTableColumnHeaderText
                header={resolveExpandableTableHeaderText(
                  column.header,
                  column.headerTranslations,
                  locale,
                  column.removable
                )}
                required={column.required}
              />
            </span>
            {column.headerChipI18nKey ? (
              <HeaderChip text={t(column.headerChipI18nKey)} />
            ) : null}
          </div>
        );

        const headerMain = (
          <Tooltip>
            <TooltipTrigger className="min-w-0 flex-1">
              {headerLabel}
            </TooltipTrigger>
            {headerInvalid ? (
              <TooltipContent side="top" align="center" className="max-w-xs text-pretty">
                {headerError}
              </TooltipContent>
            ) : null}
          </Tooltip>
        );

        const colMinW = resolveColumnMinWidthPx(column);
        const headerCellWidthLock = {
          width: colMinW,
          minWidth: colMinW,
          maxWidth: colMinW,
        } as const;
        return (
          <TableHead
            key={column.key}
            style={
              sticky
                ? { left, ...headerCellWidthLock }
                : headerCellWidthLock
            }
            className={cn(
              "h-10 bg-[#F7F8FC] px-2 align-middle whitespace-normal wrap-break-word",
              sticky && "sticky z-30",
              sticky &&
                column.key === lastLeftStickyEdgeKey &&
                STICKY_LEFT_STACK_OUTER_SHADOW,
            )}
          >
            <div className="flex h-full min-w-0 items-center gap-1">
              {headerMain}
              {column.removable && !isReadOnly ? (
                <Tooltip>
                  <TooltipTrigger className="inline-flex shrink-0 self-center">
                    <Button
                      type="button"
                      size="icon-xs"
                      variant="ghost"
                      className="hover:bg-muted/60"
                      onClick={() => onRemoveColumnByKey(column.key)}
                      aria-label={removeColumnTooltip}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">{removeColumnTooltip}</TooltipContent>
                </Tooltip>
              ) : null}
            </div>
          </TableHead>
        );
      })}
      {!isReadOnly && (
        <TableHead className={addColumnHeaderCellClassName}>
          <Button
            type="button"
            variant="ghost"
            className="inline-flex h-full min-h-10 w-full items-center justify-center gap-1.5 rounded-none border-0 bg-transparent px-2 hover:bg-muted/60"
            onClick={onAppendColumn}
            aria-label={addColumnButtonText}
          >
            <Plus className="size-4 shrink-0" aria-hidden />
            <span className="min-w-0 truncate text-sm">{addColumnButtonText}</span>
          </Button>
        </TableHead>
      )}
    </TableRow>
  );
}

function areHeaderRowPropsEqual(
  prev: HeaderRowProps,
  next: HeaderRowProps
): boolean {
  return (
    prev.tableColumns === next.tableColumns &&
    prev.headerValidationSig === next.headerValidationSig &&
    prev.locale === next.locale &&
    prev.showIndexColumn === next.showIndexColumn &&
    prev.addColumnButtonText === next.addColumnButtonText &&
    prev.headerInputPlaceholder === next.headerInputPlaceholder &&
    prev.indexColumnLabel === next.indexColumnLabel &&
    prev.removeColumnTooltip === next.removeColumnTooltip &&
    prev.isReadOnly === next.isReadOnly &&
    prev.onAppendColumn === next.onAppendColumn &&
    prev.onRemoveColumnByKey === next.onRemoveColumnByKey &&
    prev.onSetColumnHeader === next.onSetColumnHeader
  );
}

export const TableHeaderRow = memo(TableHeaderRowInner, areHeaderRowPropsEqual);
