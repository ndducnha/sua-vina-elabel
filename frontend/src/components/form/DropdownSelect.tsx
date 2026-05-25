import { ChevronDownIcon, XIcon } from "lucide-react";
import {
  memo,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function shieldSearchInputKeysFromMenu(e: KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Escape") return;
  if (e.key === "Tab") return;
  if (e.key === "ArrowLeft" && e.currentTarget.selectionStart === 0) return;
  e.stopPropagation();
}

/** Exported for table / filter dropdowns that share searchable menu layout. */
export const DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS = 10;

export type SearchableFilterDropdownMenuContentProps = {
  menuTitle: string;
  showSearch: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  searchPlaceholder: string;
  menuContentClassName?: string;
  /** Called when the scrollable option list scrolls (e.g. to dismiss a floating option tooltip). */
  onMenuBodyScroll?: () => void;
  /** Called when pointer leaves the scrollable list area (not moving between rows inside it). */
  onMenuBodyLeave?: () => void;
  /** Rows inside `DropdownMenuGroup` (items, empty state, etc.). */
  children: ReactNode;
};

/**
 * Shared popup layout: optional search header + scrollable `DropdownMenuGroup` body.
 * Use with `DropdownMenu` + `highlightItemOnHover={!showSearch}` and reset `searchQuery` in `onOpenChange(false)`.
 */
export function SearchableFilterDropdownMenuContent({
  menuTitle,
  showSearch,
  searchQuery,
  onSearchChange,
  searchInputRef,
  searchPlaceholder,
  menuContentClassName,
  children,
  onMenuBodyScroll,
  onMenuBodyLeave,
}: SearchableFilterDropdownMenuContentProps) {
  const { t } = useTranslation();
  const showClear = searchQuery.trim().length > 0;

  return (
    <DropdownMenuContent
      className={cn(
        "flex min-h-0 min-w-48 max-h-[min(24rem,var(--available-height))] flex-col overflow-hidden rounded-lg p-0",
        menuContentClassName,
      )}
      align="start"
      {...(showSearch
        ? {
            role: "dialog",
            "aria-label": menuTitle,
          }
        : {})}
    >
      {showSearch ? (
        <div
          className="bg-popover border-border relative z-20 mt-0 w-full shrink-0 rounded-t-lg border-b px-2 py-2"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <input
            ref={searchInputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={shieldSearchInputKeysFromMenu}
            onKeyUp={shieldSearchInputKeysFromMenu}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            className={cn(
              "h-8 w-full min-w-0 rounded-md border border-input bg-popover py-1 text-sm text-popover-foreground shadow-none outline-none",
              showClear ? "pl-2.5 pr-8" : "px-2.5",
              "placeholder:text-muted-foreground",
              "focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
          {showClear ? (
            <button
              type="button"
              tabIndex={-1}
              className="text-muted-foreground hover:text-foreground absolute inset-e-1.5 top-1/2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md transition-colors"
              aria-label={t("common.clearSearch")}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSearchChange("");
                requestAnimationFrame(() => {
                  searchInputRef.current?.focus({ preventScroll: true });
                });
              }}
            >
              <XIcon className="size-4 shrink-0" aria-hidden />
            </button>
          ) : null}
        </div>
      ) : null}
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1"
        onScroll={onMenuBodyScroll}
        onPointerLeave={(e) => {
          const rel = e.relatedTarget;
          if (rel instanceof Node && e.currentTarget.contains(rel)) return;
          onMenuBodyLeave?.();
        }}
      >
        <DropdownMenuGroup>
          {!showSearch ? (
            <>
              <DropdownMenuLabel>{menuTitle}</DropdownMenuLabel>
              <DropdownMenuSeparator />
            </>
          ) : null}
          {children}
        </DropdownMenuGroup>
      </div>
    </DropdownMenuContent>
  );
}

/**
 * Same pattern as dynamic-table `SelectFilterField`: outline trigger + chevron + anchored menu
 * with label header, separators, rounded items, accent selection.
 */
export type DropdownSelectOption = { value: string; label: string; tooltip?: string };

/** When `searchable` is omitted, search UI is shown if option count >= this value. */
const AUTO_SEARCH_MIN_OPTIONS = DROPDOWN_FILTER_AUTO_SEARCH_MIN_OPTIONS;

export type DropdownSelectProps = {
  id?: string;
  value: string;
  options: DropdownSelectOption[];
  placeholder: string;
  menuTitle: string;
  disabled?: boolean;
  onCommit: (value: string) => void;
  error?: boolean;
  className?: string;
  /**
   * When `true`, menu header is a search field (no duplicate title row).
   * When `false`, always use the static `menuTitle` label.
   * When omitted, search is enabled automatically when `options.length >= AUTO_SEARCH_MIN_OPTIONS`.
   */
  searchable?: boolean;
  searchPlaceholder?: string;
};

function DropdownSelectInner({
  id,
  value,
  options,
  placeholder,
  menuTitle,
  disabled,
  onCommit,
  error,
  className,
  searchable,
  searchPlaceholder,
}: DropdownSelectProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const triggerLabelRef = useRef<HTMLSpanElement>(null);
  const [triggerTruncated, setTriggerTruncated] = useState(false);
  const [optionTip, setOptionTip] = useState<{ text: string; x: number; y: number } | null>(null);

  const showSearch =
    searchable === true || (searchable !== false && options.length >= AUTO_SEARCH_MIN_OPTIONS);

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );
  const isPlaceholder = !selectedOption;
  const triggerLabel = selectedOption?.label ?? placeholder;

  useLayoutEffect(() => {
    const el = triggerLabelRef.current;
    if (!el) return;
    const measure = () => setTriggerTruncated(el.scrollWidth > el.clientWidth + 1);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [triggerLabel]);

  const filteredOptions = useMemo(() => {
    if (!showSearch) return options;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) || opt.value.toLowerCase().includes(q),
    );
  }, [options, searchQuery, showSearch]);

  const ph = searchPlaceholder ?? t("common.searchOptions");

  return (
    <>
    <DropdownMenu
      highlightItemOnHover={!showSearch}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setSearchQuery("");
          setOptionTip(null);
          return;
        }
        if (showSearch) {
          queueMicrotask(() => {
            requestAnimationFrame(() => {
              searchInputRef.current?.focus({ preventScroll: true });
            });
          });
        }
      }}
    >
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            id={id}
            variant="outline"
            disabled={disabled}
            aria-haspopup="menu"
            title={disabled && triggerTruncated ? triggerLabel : undefined}
            className={cn(
              "mb-0 h-10 w-full max-w-full min-w-0 justify-between gap-1 bg-white font-normal hover:bg-white dark:bg-white dark:hover:bg-white aria-expanded:bg-white",
              className,
              error && "border-red-400",
            )}
          >
            <span
              ref={triggerLabelRef}
              className={cn("truncate", isPlaceholder && "text-muted-foreground/70")}
            >
              {triggerLabel}
            </span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
          </Button>
        }
      />
      <SearchableFilterDropdownMenuContent
        menuTitle={menuTitle}
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchInputRef={searchInputRef}
        searchPlaceholder={ph}
        onMenuBodyScroll={() => setOptionTip(null)}
        onMenuBodyLeave={() => setOptionTip(null)}
      >
        {filteredOptions.length === 0 ? (
          <div className="text-muted-foreground px-2 py-3 text-center text-sm">
            {t("common.noData")}
          </div>
        ) : (
          filteredOptions.map((opt) => {
            const tipText = opt.tooltip ?? opt.label;
            return (
              <DropdownMenuItem
                key={opt.value}
                onClick={() => onCommit(opt.value)}
                onPointerEnter={(e) => {
                  const labelEl = e.currentTarget.querySelector("[data-dropdown-option-label]");
                  if (
                    !opt.tooltip &&
                    labelEl instanceof HTMLElement &&
                    labelEl.scrollWidth <= labelEl.clientWidth + 1
                  ) {
                    setOptionTip(null);
                    return;
                  }
                  const r = e.currentTarget.getBoundingClientRect();
                  setOptionTip({ text: tipText, x: r.left + r.width / 2, y: r.top });
                }}
                className={cn("min-w-0", opt.value === value && "bg-accent")}
              >
                <div className="min-w-0 max-w-full flex-1">
                  <span data-dropdown-option-label className="block truncate">
                    {opt.label}
                  </span>
                </div>
              </DropdownMenuItem>
            );
          })
        )}
      </SearchableFilterDropdownMenuContent>
    </DropdownMenu>
    {optionTip
      ? createPortal(
          <div
            role="tooltip"
            className="pointer-events-none fixed z-200 max-w-xs rounded-md border border-border bg-tooltip-popover px-3 py-1.5 text-xs text-pretty text-tooltip-popover-foreground shadow-md"
            style={{
              left: optionTip.x,
              top: optionTip.y,
              transform: "translate(-50%, calc(-100% - 8px))",
            }}
          >
            {optionTip.text}
          </div>,
          document.body,
        )
      : null}
    </>
  );
}

export const DropdownSelect = memo(DropdownSelectInner) as typeof DropdownSelectInner;
