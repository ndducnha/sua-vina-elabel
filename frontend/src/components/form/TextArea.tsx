import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState, type ChangeEvent, type ComponentProps, type MutableRefObject, type Ref } from "react";

/** Default cap for supplier info & product description (create + edit). */
export const PRODUCT_BASIC_TEXTAREA_MAX_LENGTH = 255;

export function truncateBasicTextarea(value: unknown): string {
  return String(value ?? "").slice(0, PRODUCT_BASIC_TEXTAREA_MAX_LENGTH);
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (!ref) return;
  if (typeof ref === "function") ref(value);
  else (ref as MutableRefObject<T | null>).current = value;
}

export type TextAreaProps = Omit<ComponentProps<"textarea">, "maxLength"> & {
  /** Defaults to {@link PRODUCT_BASIC_TEXTAREA_MAX_LENGTH}. */
  maxLength?: number;
  counterClassName?: string;
  showCounter?: boolean;
};

/**
 * Textarea with max length, live character count, and input truncation so RHF state matches the DOM
 * (spread `register()` first; truncation runs before the registered `onChange`).
 */
export function TextArea({
  maxLength = PRODUCT_BASIC_TEXTAREA_MAX_LENGTH,
  counterClassName,
  showCounter = true,
  className,
  onChange,
  value,
  defaultValue,
  ref,
  ...textareaRest
}: TextAreaProps) {
  const isControlled = value !== undefined;

  const [internalLen, setInternalLen] = useState(0);

  const displayLength = useMemo(() => {
    if (isControlled) return String(value ?? "").length;
    return internalLen;
  }, [isControlled, value, internalLen]);

  const mergedRef = useCallback(
    (el: HTMLTextAreaElement | null) => {
      assignRef(ref, el);
      if (!el || isControlled) return;
      let v = el.value;
      if (v.length > maxLength) {
        v = v.slice(0, maxLength);
        el.value = v;
      }
      setInternalLen(v.length);
    },
    [ref, isControlled, maxLength],
  );

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    let v = e.target.value;
    if (v.length > maxLength) {
      v = v.slice(0, maxLength);
      e.target.value = v;
    }
    onChange?.(e);
    if (!isControlled) {
      setInternalLen(v.length);
    }
  };

  return (
    <div className="w-full">
      <textarea
        {...textareaRest}
        ref={mergedRef}
        maxLength={maxLength}
        className={cn("resize-none", className)}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
      />
      {showCounter ? (
        <p className={cn("mt-1 text-right text-xs text-gray-500", counterClassName)}>
          {displayLength}/{maxLength}
        </p>
      ) : null}
    </div>
  );
}
