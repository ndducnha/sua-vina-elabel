import type { DynamicFilterField } from "../types";
import { parseDynamicFilterMultiValues } from "../types";

/**
 * Query object suitable for `serializeQueryParamsWithRepeatedArrayKeys` (or similar):
 * - `search` / `select` → `string`
 * - `multiselect` → `string[]` (from comma-separated `ServerListQuery.filters` values)
 *
 * `field.id` should match the backend query parameter name.
 */
export function buildApiQueryParamsFromDynamicFilters(
  fields: DynamicFilterField[],
  values: Record<string, string>
): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};

  for (const field of fields) {
    const raw = values[field.id];

    if (field.type === "multiselect") {
      const parts = parseDynamicFilterMultiValues(raw);
      if (parts.length) {
        out[field.id] = parts;
      }
      continue;
    }

    if (field.type === "search") {
      const s = raw?.trim();
      if (s) {
        out[field.id] = s;
      }
      continue;
    }

    if (field.type === "dateRange") {
      const from = values[field.fromKey]?.trim();
      const to = values[field.toKey]?.trim();
      if (from) {
        out[field.fromKey] = from;
      }
      if (to) {
        out[field.toKey] = to;
      }
      continue;
    }

    if (field.type === "select") {
      const s = raw?.trim() ?? "";
      const omit = field.omitSelectValues ?? [];
      if (omit.includes(s)) {
        continue;
      }
      if (s) {
        out[field.id] = s;
      }
    }
  }

  return out;
}
