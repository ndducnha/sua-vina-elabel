import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, type FieldValues, type Path } from "react-hook-form";

import i18n from "@/i18n";
import { cn } from "@/lib/utils";

import {
  FIELD_VALIDATION_PHASE,
  type FieldValidationPhase,
  type FormFieldConfig,
} from "./types";
import { buildRules } from "./utils";

type TextFieldProps<TFieldValues extends FieldValues> = {
  config: FormFieldConfig<TFieldValues>;
  controlClassName?: string;
  /** Merged in FormField: RHF error → error; else `getFieldValidationState` (warning / success / …). */
  fieldValidationPhase?: FieldValidationPhase;
};

function TextAreaFieldInner<TFieldValues extends FieldValues>({
  config,
  controlClassName,
  fieldValidationPhase = FIELD_VALIDATION_PHASE.NEUTRAL,
}: TextFieldProps<TFieldValues>) {
  const methods = useFormContext<TFieldValues>();
  const { register, setValue, setError, clearErrors, trigger, getValues } = methods;
  const rules = useMemo(() => buildRules(config), [config]);
  const mergedClass = cn(controlClassName, config.controlClassName);

  const name = config.name as Path<TFieldValues>;
  const { ref, onChange: rhfOnChange, onBlur: rhfOnBlur, name: rhfName } = register(name, rules);

  const [inputValue, setInputValue] = useState(() => {
    const v = getValues(name);
    if (v == null) {
      return "";
    }
    return String(v);
  });

  const textAsync = config.textAsyncValidation;
  const debounceMs = textAsync ? textAsync.debounceMs : 0;
  const [debouncedValue, setDebouncedValue] = useState(inputValue);
  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedValue(inputValue), debounceMs);
    return () => window.clearTimeout(id);
  }, [inputValue, debounceMs]);

  const [isAsyncValidating, setIsAsyncValidating] = useState(false);
  /** When we have set an RHF `type: "async"` error; only then clear+trigger on success. */
  const hasPendingAsyncErrorRef = useRef(false);
  /** Ensures `setIsAsyncValidating(false)` in `finally` only applies to the latest run (abort + overlap). */
  const asyncRunId = useRef(0);

  useEffect(() => {
    if (!textAsync) {
      return;
    }

    const runId = ++asyncRunId.current;
    const controller = new AbortController();
    setIsAsyncValidating(true);

    const run = async () => {
      try {
        const result = await textAsync.validate(debouncedValue, {
          methods,
          signal: controller.signal,
        });
        if (controller.signal.aborted) {
          return;
        }
        if (result === true) {
          if (hasPendingAsyncErrorRef.current) {
            hasPendingAsyncErrorRef.current = false;
            clearErrors(name);
            await trigger(name, { shouldFocus: false });
          }
        } else {
          hasPendingAsyncErrorRef.current = true;
          setError(name, { type: "async", message: result });
        }
      } catch {
        if (controller.signal.aborted) {
          return;
        }
        hasPendingAsyncErrorRef.current = true;
        setError(name, {
          type: "async",
          message: i18n.t("common.error"),
        });
      } finally {
        if (runId === asyncRunId.current) {
          setIsAsyncValidating(false);
        }
      }
    };

    void run();
    return () => {
      controller.abort();
    };
  }, [debouncedValue, name, textAsync, setError, clearErrors, trigger]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      setInputValue(value);
      rhfOnChange(event);
    },
    [rhfOnChange]
  );

  const handleBlur = useCallback(
    (event: React.FocusEvent<HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (typeof value === "string") {
        const normalized = value.trim();
        if (normalized !== value) {
          setValue(name, normalized as never, {
            shouldValidate: true,
            shouldDirty: true,
            shouldTouch: true,
          });
          setInputValue(normalized);
        }
      }
      rhfOnBlur(event);
    },
    [name, rhfOnBlur, setValue]
  );

  const isError = fieldValidationPhase === FIELD_VALIDATION_PHASE.ERROR;

  return (
    <div className="flex w-full min-w-0 flex-col gap-1">
      <textarea
        id={String(config.name)}
        placeholder={config.placeholder}
        autoComplete={config.autoComplete}
        disabled={config.disabled}
        aria-label={config.hideLabel ? config.label : undefined}
        data-field-validation={fieldValidationPhase}
        className={cn(
          "w-full max-h-48 min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          mergedClass,
          !isError && fieldValidationPhase === FIELD_VALIDATION_PHASE.WARNING && [
            "border-amber-500 focus-visible:border-amber-500",
            "focus-visible:ring-amber-500/35",
            "dark:border-amber-500/80",
          ],
          !isError &&
            fieldValidationPhase === FIELD_VALIDATION_PHASE.SUCCESS && [
              "border-emerald-600 focus-visible:border-emerald-600",
              "focus-visible:ring-emerald-500/30",
              "dark:border-emerald-500/70",
            ]
        )}
        maxLength={config.maxLength}
        ref={ref}
        name={rhfName}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={isError}
        aria-busy={textAsync ? isAsyncValidating : undefined}
      />
      {textAsync && isAsyncValidating && textAsync.validatingMessage ? (
        <p className="text-muted-foreground text-xs" role="status">
          {textAsync.validatingMessage}
        </p>
      ) : null}
    </div>
  );
}

export const TextAreaField = memo(TextAreaFieldInner) as typeof TextAreaFieldInner;
