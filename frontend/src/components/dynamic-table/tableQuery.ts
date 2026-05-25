import type { SortingState } from "@tanstack/react-table";

import type { ServerListQuery, ServerSortState } from "./types";

/** page, pageSize, sort, filters — keys filters initialized empty by the list of ids. */
export function createInitialServerListQuery(filterIds: string[]): ServerListQuery {
  return {
    page: 1,
    pageSize: 10,
    sort: null,
    filters: Object.fromEntries(filterIds.map((id) => [id, ""])),
  };
}

export function sortingStateToServer(sorting: SortingState): ServerSortState {
  const first = sorting[0];
  if (!first?.id) return null;
  return { columnId: first.id, desc: !!first.desc };
}

export function serverSortToSortingState(sort: ServerSortState): SortingState {
  if (!sort?.columnId) return [];
  return [{ id: sort.columnId, desc: sort.desc }];
}
