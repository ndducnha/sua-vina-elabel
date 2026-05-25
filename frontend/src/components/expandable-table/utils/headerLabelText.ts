import type { ExpandableTableColumnHeaderTranslations } from "../types";

export function resolveExpandableTableHeaderText(
  header: string,
  headerTranslations: ExpandableTableColumnHeaderTranslations | undefined,
  i18nLanguage: string,
  removable: boolean
): string {
  if (removable) {
    return header;
  }
  if (!headerTranslations) {
    return header;
  }
  const base = (i18nLanguage || "vi").split("-")[0]?.toLowerCase() ?? "vi";
  if (base === "en" && headerTranslations.en?.trim()) {
    return headerTranslations.en.trim();
  }
  if (base === "vi" && headerTranslations.vi?.trim()) {
    return headerTranslations.vi.trim();
  }
  return header;
}
