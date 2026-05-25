import { memo, useId } from "react";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FIELD_VALIDATION_PHASE, type FieldValidationPhase } from "@/components/dynamic-form/types";
import { cn } from "@/lib/utils";
import { resolveInputBound } from "../utils/resolveColumnInputBounds";
import type { ExpandableTableCellInputType } from "../types";

type TableCellInputProps = {
  rowId: number;
  columnKey: string;
  value: string;
  placeholder: string;
  inputType: ExpandableTableCellInputType;
  rowIndex: number;
  errorMessage?: string;
  disabled?: boolean;
  min?: number | string;
  max?: number | string;
  onSetCellValue: (rowId: number, columnKey: string, value: string) => void;
  /** Under-input phased copy; does not affect input border (see expandable-table column `cellFeedbackResolver`). */
  phaseFeedback?: { phase: FieldValidationPhase; message?: string };
};

function TableCellInputInner({
  rowId,
  columnKey,
  value,
  placeholder,
  inputType,
  rowIndex,
  errorMessage,
  disabled = false,
  min,
  max,
  onSetCellValue,
  phaseFeedback,
}: TableCellInputProps) {
  const errId = useId();
  const fbId = useId();
  const showError = Boolean(errorMessage);
  const minAttr = resolveInputBound(min, inputType);
  const maxAttr = resolveInputBound(max, inputType);
  const lineError =
    phaseFeedback?.phase === FIELD_VALIDATION_PHASE.ERROR ? phaseFeedback.message : undefined;
  const lineWarning =
    phaseFeedback?.phase === FIELD_VALIDATION_PHASE.WARNING ? phaseFeedback.message : undefined;
  const showDisabledValueTooltip = disabled && value.trim() !== "" && !showError;
  const describedByParts = [
    showError ? errId : null,
    lineError || lineWarning ? fbId : null,
  ].filter(Boolean) as string[];
  const describedBy = describedByParts.length ? describedByParts.join(" ") : undefined;
  const borderClass = showError
    ? "border-destructive focus-visible:ring-destructive/40"
    : undefined;

  const input = (
    <Input
      type={inputType}
      value={value}
      disabled={disabled}
      min={minAttr}
      max={maxAttr}
      onChange={(event) => onSetCellValue(rowId, columnKey, event.target.value)}
      placeholder={placeholder}
      aria-label={`Row ${rowIndex + 1} ${columnKey}`}
      aria-invalid={showError || Boolean(lineError)}
      aria-describedby={describedBy}
      className={cn(
        borderClass,
        disabled && "bg-muted/60",
        disabled && "min-w-0 cursor-default truncate",
      )}
    />
  );

  return (
    <div className="min-w-0 w-full">
      {showDisabledValueTooltip ? (
        <Tooltip>
          <TooltipTrigger className="flex w-full min-w-0">
            <div className="w-full min-w-0">{input}</div>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="max-w-md text-pretty wrap-anywhere">
            {value}
          </TooltipContent>
        </Tooltip>
      ) : (
        input
      )}
      {showError && errorMessage ? (
        <p
          id={errId}
          className="text-destructive mt-1 max-w-full wrap-break-word text-pretty text-xs leading-snug"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}
      {lineError ? (
        <p
          id={fbId}
          className="text-destructive mt-1 max-w-full wrap-break-word text-pretty text-xs leading-snug"
        >
          {lineError}
        </p>
      ) : lineWarning ? (
        <p
          id={fbId}
          className="mt-1 max-w-full wrap-break-word text-pretty text-xs leading-snug text-amber-600 dark:text-amber-500"
        >
          {lineWarning}
        </p>
      ) : null}
    </div>
  );
}

function areCellPropsEqual(prev: TableCellInputProps, next: TableCellInputProps): boolean {
  return (
    prev.rowId === next.rowId &&
    prev.columnKey === next.columnKey &&
    prev.value === next.value &&
    prev.placeholder === next.placeholder &&
    prev.inputType === next.inputType &&
    prev.rowIndex === next.rowIndex &&
    prev.errorMessage === next.errorMessage &&
    prev.disabled === next.disabled &&
    prev.min === next.min &&
    prev.max === next.max &&
    prev.onSetCellValue === next.onSetCellValue &&
    prev.phaseFeedback?.phase === next.phaseFeedback?.phase &&
    prev.phaseFeedback?.message === next.phaseFeedback?.message
  );
}

export const TableCellInput = memo(TableCellInputInner, areCellPropsEqual);
