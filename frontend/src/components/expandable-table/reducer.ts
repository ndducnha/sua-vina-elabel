import {
  ExpandableTableActionType,
  type ExpandableTableAction,
  type ExpandableTableState,
} from "./types";
import {
  applyExternalColumnsReducer,
  applyExternalRowsReducer,
  appendColumnReducer,
  appendRowReducer,
  removeAllRemovableColumnsReducer,
  removeAllRemovableRowsReducer,
  removeColumnByKeyReducer,
  removeRowByIdReducer,
  resetAllTableDataReducer,
  setCellValueReducer,
  setColumnHeaderReducer,
} from "./utils/reducerHandlers";

export { createState, type CreateStateOptions } from "./utils/reducerHandlers";

export function expandableTableReducer(
  state: ExpandableTableState,
  action: ExpandableTableAction
): ExpandableTableState {
  switch (action.type) {
    case ExpandableTableActionType.ApplyExternalColumns:
      return applyExternalColumnsReducer(state, action.payload.columns);
    case ExpandableTableActionType.ApplyExternalRows:
      return applyExternalRowsReducer(state, action.payload.rows);
    case ExpandableTableActionType.AppendColumn:
      return appendColumnReducer(state, action.payload.requiredByDefault);
    case ExpandableTableActionType.RemoveColumnByKey:
      return removeColumnByKeyReducer(state, action.payload.columnKey);
    case ExpandableTableActionType.AppendRow:
      return appendRowReducer(state);
    case ExpandableTableActionType.RemoveRowById:
      return removeRowByIdReducer(state, action.payload.rowId);
    case ExpandableTableActionType.SetColumnHeader:
      return setColumnHeaderReducer(
        state,
        action.payload.columnKey,
        action.payload.headerValue
      );
    case ExpandableTableActionType.SetCellValue:
      return setCellValueReducer(
        state,
        action.payload.rowId,
        action.payload.columnKey,
        action.payload.value
      );
    case ExpandableTableActionType.ResetAllTableData:
      return resetAllTableDataReducer(state);
    case ExpandableTableActionType.RemoveAllRemovableColumns:
      return removeAllRemovableColumnsReducer(state);
    case ExpandableTableActionType.RemoveAllRemovableRows:
      return removeAllRemovableRowsReducer(state);
    default:
      return state;
  }
}
