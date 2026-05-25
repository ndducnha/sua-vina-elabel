import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ExpandableTable as ExpandableTableView } from "./components/ExpandableTable";
import { useExpandableTable } from "./hooks/useExpandableTable";
import type { ExpandableTableProps } from "./types";

export function ExpandableTable({
  showIndexColumn = true,
  addColumnButtonText,
  addRowButtonText,
  headerInputPlaceholder,
  cellInputPlaceholder,
  emptyNoRowsMessage,
  emptyNoColumnsMessage,
  validationMessages: validationMessagesOverride,
  className,
  isReadOnly = false,
  tableTitle,
  ...tableProps
}: ExpandableTableProps) {
  const { t, i18n } = useTranslation();

  const resolvedAddColumn = addColumnButtonText ?? t("expandableTable.addColumn");
  const resolvedAddRow = addRowButtonText ?? t("expandableTable.addRow");
  const resolvedHeaderPh = headerInputPlaceholder ?? t("expandableTable.headerFieldPlaceholder");
  const resolvedCellPh = cellInputPlaceholder ?? t("expandableTable.cellValuePlaceholder");
  const resolvedEmptyRows = emptyNoRowsMessage ?? t("expandableTable.emptyNoRows");
  const resolvedEmptyCols = emptyNoColumnsMessage ?? t("expandableTable.emptyNoColumns");

  const validationMessages = useMemo(
    () => ({
      duplicateHeader: t("expandableTable.validationDuplicateHeader"),
      required: t("expandableTable.validationRequired"),
      unique: t("expandableTable.validationUnique"),
      columnInvalid: t("expandableTable.validationColumnInvalid"),
      ...validationMessagesOverride,
    }),
    [t, validationMessagesOverride]
  );

  const {
    tableColumns,
    tableRows,
    validation,
    hasAnyColumn,
    appendColumn,
    removeColumnByKey,
    appendRow,
    removeRowById,
    setColumnHeader,
    setCellValue,
    resetAllTableData,
    resetAllAddedColumns,
    resetAllAddedRows,
  } = useExpandableTable({ ...tableProps, validationMessages });

  return (
    <ExpandableTableView
      tableColumns={tableColumns}
      tableRows={tableRows}
      validation={validation}
      locale={i18n.language}
      hasAnyColumn={hasAnyColumn}
      onClickRow={tableProps.onClickRow}
      showIndexColumn={showIndexColumn}
      addColumnButtonText={resolvedAddColumn}
      addRowButtonText={resolvedAddRow}
      headerInputPlaceholder={resolvedHeaderPh}
      cellInputPlaceholder={resolvedCellPh}
      emptyNoRowsMessage={resolvedEmptyRows}
      emptyNoColumnsMessage={resolvedEmptyCols}
      indexColumnLabel={t("expandableTable.indexColumn")}
      removeColumnTooltip={t("expandableTable.removeColumn")}
      removeRowTooltip={t("expandableTable.removeRow")}
      className={className}
      onAppendColumn={appendColumn}
      onRemoveColumnByKey={removeColumnByKey}
      onAppendRow={appendRow}
      onRemoveRowById={removeRowById}
      onSetColumnHeader={setColumnHeader}
      onSetCellValue={setCellValue}
      onResetAllTableData={resetAllTableData}
      onResetAllAddedColumns={resetAllAddedColumns}
      onResetAllAddedRows={resetAllAddedRows}
      isReadOnly={isReadOnly}
      tableTitle={tableTitle}
    />
  );
}

export type {
  ExpandableTableCellInputType,
  ExpandableTableCellFeedbackResolver,
  ExpandableTableCellPhaseFeedback,
  ExpandableTableColumnConfig,
  ExpandableTableColumnHeaderTranslations,
  ExpandableTableColumnValidator,
  ExpandableTableColumnValidatorArgs,
  ExpandableTableColumn,
  ExpandableTableColumnInput,
  ExpandableTableRow,
  ExpandableTableChangePayload,
  ExpandableTableProps,
  ExpandableTableValidationMessages,
  ExpandableTableValidationResult,
} from "./types";
export {
  DEFAULT_CELL_PLACEHOLDER,
  DEFAULT_COLUMN_BUTTON_TEXT,
  DEFAULT_HEADER_PLACEHOLDER,
  DEFAULT_ROW_BUTTON_TEXT,
} from "./types";
export { HeaderChip } from "./components/HeaderChip";
export {
  DEFAULT_VALIDATION_MESSAGES,
  cellErrorKey,
  computeExpandableTableValidation,
  headerRowValidationSignature,
  rowCellValidationSignature,
} from "./utils/expandableTableValidation";
export { formatLocalYMD, resolveInputBound } from "./utils/resolveColumnInputBounds";
export { EXTRA_COLUMN_PREFIX, nextExtraColumnIndex } from "./utils/mappers";
export { resolveExpandableTableHeaderText } from "./utils/headerLabelText";
