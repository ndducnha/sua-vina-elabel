import { memo } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";

import { cn } from "@/lib/utils";

import type { FormFieldConfig } from "./types";
import { buildRules } from "./utils";

type SelectFieldProps<TFieldValues extends FieldValues> = {
  config: FormFieldConfig<TFieldValues>;
  controlClassName?: string;
  hasError?: boolean;
};

function SelectFieldInner<TFieldValues extends FieldValues>({
  config,
  controlClassName,
  hasError = false,
}: SelectFieldProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const rules = buildRules(config);
  const mergedClass = cn(controlClassName, config.controlClassName);

  return (
    <select
      id={config.name}
      aria-label={config.hideLabel ? config.label : undefined}
      disabled={config.disabled}
      className={cn(
        "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
        hasError &&
          "border-destructive ring-3 ring-destructive/20 focus-visible:border-destructive focus-visible:ring-destructive/20 dark:border-destructive/50 dark:ring-destructive/40",
        mergedClass
      )}
      {...register(config.name as Path<TFieldValues>, rules)}
      aria-invalid={hasError}
    >
      <option value="">{config.placeholder ?? `Select ${config.label}`}</option>
      {(config.options ?? []).map((option) => (
        <option key={`${config.name}-${option.value}`} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export const SelectField = memo(SelectFieldInner) as typeof SelectFieldInner;
