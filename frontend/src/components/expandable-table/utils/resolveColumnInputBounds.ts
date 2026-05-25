import type { ExpandableTableCellInputType } from "../types";

/** Local calendar day as `YYYY-MM-DD` (for `<input type="date" />`). */
export function formatLocalYMD(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Resolves `min` / `max` for native inputs. For dates, `min` / `max` may be
 * the literal `"today"`; for numbers, use numeric (or string that parses) bounds.
 */
export function resolveInputBound(
  bound: number | string | undefined,
  inputType: ExpandableTableCellInputType
): string | number | undefined {
  if (bound === undefined) return undefined;

  if (inputType === "date") {
    if (bound === "today") return formatLocalYMD();
    if (typeof bound === "string" && /^\d{4}-\d{2}-\d{2}$/.test(bound)) return bound;
    return undefined;
  }

  if (inputType === "number") {
    if (typeof bound === "number" && Number.isFinite(bound)) return bound;
    if (typeof bound === "string" && bound.trim() !== "") {
      const n = Number(bound);
      if (Number.isFinite(n)) return n;
    }
    return undefined;
  }

  return undefined;
}
