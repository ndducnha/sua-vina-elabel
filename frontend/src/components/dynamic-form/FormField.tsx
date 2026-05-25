import { memo } from "react";
import { useFormContext, useFormState, useWatch } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { Info } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  FIELD_VALIDATION_PHASE,
  FORM_FIELD_TYPE,
  type FormFieldConfig,
  type FieldValidationPhase,
} from "./types";
import { buildRules, getNestedError } from "./utils";
import { TextField } from "./TextField";
import { SelectField } from "./SelectField";
import { PasswordField } from "./PasswordField";
import { DateFormControl } from "./DateFormControl";
import { TextAreaField } from "./TextAreaField";

type FormFieldProps<TFieldValues extends FieldValues> = {
  config: FormFieldConfig<TFieldValues>;
  controlClassName?: string;
  labelClassName?: string;
  fieldGroupClassName?: string;
};

function FormFieldInner<TFieldValues extends FieldValues>({
  config,
  controlClassName,
  labelClassName: formLabelClassName,
  fieldGroupClassName = "space-y-2",
}: FormFieldProps<TFieldValues>) {
  // Subscribe only to errors for this specific field — no global re-render
  const { errors } = useFormState<TFieldValues>({ name: config.name });
  const methods = useFormContext<TFieldValues>();
  const watchPaths = [config.name, ...(config.fieldValidationDependencies ?? [])] as Path<
    TFieldValues
  >[];
  useWatch({ control: methods.control, name: watchPaths });
  const errorMessage = getNestedError(
    errors as unknown as Record<string, unknown>,
    String(config.name)
  );
  const hasError = Boolean(errorMessage);
  const derived = config.getFieldValidationState?.(methods) ?? null;
  const textValidationPhase: FieldValidationPhase = errorMessage
    ? FIELD_VALIDATION_PHASE.ERROR
    : (derived?.phase ?? FIELD_VALIDATION_PHASE.NEUTRAL);
  const lineError =
    errorMessage ||
    (derived?.phase === FIELD_VALIDATION_PHASE.ERROR ? derived.message : undefined);
  const lineWarning =
    !lineError && derived?.phase === FIELD_VALIDATION_PHASE.WARNING
      ? derived?.message
      : undefined;

  const dateRules = buildRules(config);
  const renderControl = () => {
    switch (config.type) {
      case FORM_FIELD_TYPE.PASSWORD:
        return (
          <PasswordField
            config={config}
            controlClassName={controlClassName}
            hasError={hasError}
          />
        );
      case FORM_FIELD_TYPE.SELECT:
        return <SelectField config={config} controlClassName={controlClassName} hasError={hasError} />;
      case FORM_FIELD_TYPE.DATE:
        return (
          <DateFormControl
            field={config}
            mergedControlClass={cn(controlClassName, config.controlClassName)}
            register={methods.register}
            setValue={methods.setValue}
            getValues={methods.getValues}
            rules={dateRules}
            hasError={hasError}
          />
        );
      case FORM_FIELD_TYPE.AREA:
        return (
          <TextAreaField
            config={config}
            controlClassName={controlClassName}
            fieldValidationPhase={textValidationPhase}
          />
        );
      default:
        return (
          <TextField
            config={config}
            controlClassName={controlClassName}
            fieldValidationPhase={textValidationPhase}
          />
        );
    }
  };

  return (
    <div className={cn("min-w-0 w-full", fieldGroupClassName, config.wrapperClassName)}>
      {!config.hideLabel ? (
        <div className="flex min-w-0 flex-nowrap items-baseline gap-x-2">
          <div className="flex min-w-0 shrink-0 items-center gap-1">
            <Label
              htmlFor={config.name}
              className={cn(formLabelClassName, config.labelClassName)}
            >
              {config.label}
              {config.required ? <span className="text-destructive"> *</span> : null}
            </Label>
            {config.labelInfoTooltip ? (
              <Tooltip>
                <TooltipTrigger
                  className="inline-flex shrink-0 cursor-default rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  aria-label={config.labelInfoTooltip}
                >
                  <Info className="h-4 w-4" strokeWidth={2} aria-hidden />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs text-left text-xs leading-snug">
                  {config.labelInfoTooltip}
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
          {config.hint ? (
            <Tooltip>
              <TooltipTrigger className="min-w-0 flex-1 cursor-default truncate text-xs text-muted-foreground italic">
                {config.hint}
              </TooltipTrigger>
              <TooltipContent>{config.hint}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      ) : null}

      <div className="flex w-full min-w-0 max-w-full flex-col gap-1">
        {renderControl()}
        {config.hideLabel && config.hint ? (
          <Tooltip>
            <TooltipTrigger className="block w-full cursor-default truncate text-xs text-muted-foreground italic">
              {config.hint}
            </TooltipTrigger>
            <TooltipContent>{config.hint}</TooltipContent>
          </Tooltip>
        ) : null}
        {lineError ? (
          <p className="text-destructive max-w-full min-w-0 w-full wrap-break-word text-pretty text-sm leading-snug">
            {lineError}
          </p>
        ) : null}
        {lineWarning ? (
          <p className="max-w-full min-w-0 w-full wrap-break-word text-pretty text-sm leading-snug text-amber-600 dark:text-amber-500">
            {lineWarning}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export const FormField = memo(FormFieldInner) as typeof FormFieldInner;
