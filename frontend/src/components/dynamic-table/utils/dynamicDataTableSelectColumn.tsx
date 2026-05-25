import type { ColumnDef, Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";

/** `id` of the built-in leading checkbox column (avoid clashing in column definitions). */
export const DYNAMIC_TABLE_SELECT_COLUMN_ID = "_dt_select";

type SelectAllHeaderProps<TData> = {
  table: Table<TData>;
};

function SelectAllPageHeader<TData>({ table }: SelectAllHeaderProps<TData>) {
  const ref = useRef<HTMLInputElement>(null);
  const all = table.getIsAllPageRowsSelected();
  const some = table.getIsSomePageRowsSelected();

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = some && !all;
    }
  }, [some, all]);

  return (
    <input
      ref={ref}
      type="checkbox"
      role="checkbox"
      className="border-input size-4 rounded border"
      checked={all}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  );
}

export function buildDynamicTableSelectColumn<TData>(): ColumnDef<TData, unknown> {
  return {
    id: DYNAMIC_TABLE_SELECT_COLUMN_ID,
    size: 40,
    header: ({ table }) => <SelectAllPageHeader table={table} />,
    cell: ({ row }) => (
      <input
        type="checkbox"
        role="checkbox"
        className="border-input size-4 rounded border"
        checked={row.getIsSelected()}
        onChange={row.getToggleSelectedHandler()}
      />
    ),
    enableSorting: false,
  };
}
