import type { FieldValues } from "react-hook-form";
import { FormProvider, useForm } from "react-hook-form";

import { cn } from "@/lib/utils";

import { type DynamicFormProps, type DynamicFormLayoutItem, type FormSectionConfig } from "./types";
import { FormField } from "./FormField";
import { FormSection } from "./FormSection";
import { FormSubmitArea } from "./FormSubmitArea";
import { FormStateSync } from "./FormStateSync";

function isFormSectionConfig<TFieldValues extends FieldValues>(
  item: DynamicFormLayoutItem<TFieldValues>,
): item is FormSectionConfig<TFieldValues> {
  return "block" in item && item.block === "section";
}

export function DynamicForm<TFieldValues extends FieldValues = FieldValues>({
  id,
  fields,
  formOptions,
  fieldControlClassName,
  labelClassName,
  fieldGroupClassName = "space-y-2",
  sectionTitleClassName,
  sectionContentClassName,
  submitLabel = "Submit",
  className,
  footer,
  hideDefaultSubmit = false,
  disableDefaultSpacing,
  methodMode = "onBlur", // default
  renderSubmit,
  onStateChange,
  onSubmit,
}: DynamicFormProps<TFieldValues>) {
  const methods = useForm<TFieldValues>({
    mode: methodMode as "onBlur" | "onChange" | "onSubmit" | "onTouched" | "all",
    reValidateMode: "onChange",
    ...formOptions,
  });

  return (
    <FormProvider {...methods}>
      <form
        id={id}
        onSubmit={methods.handleSubmit((formValues) => Promise.resolve(onSubmit(formValues, methods)))}
        className={cn(disableDefaultSpacing ?? "space-y-4", className)}
      >
        {fields.map((item, index) =>
          isFormSectionConfig(item) ? (
            <FormSection
              key={`section-${index}-${item.title}`}
              config={item}
              controlClassName={fieldControlClassName}
              labelClassName={labelClassName}
              fieldGroupClassName={fieldGroupClassName}
              sectionTitleClassName={sectionTitleClassName}
              sectionContentClassName={sectionContentClassName}
            />
          ) : (
            <FormField
              key={item.name}
              config={item}
              controlClassName={fieldControlClassName}
              labelClassName={labelClassName}
              fieldGroupClassName={fieldGroupClassName}
            />
          ),
        )}

        {footer}

        <FormSubmitArea<TFieldValues> submitLabel={submitLabel} hideDefaultSubmit={hideDefaultSubmit} renderSubmit={renderSubmit} />
      </form>

      {onStateChange ? <FormStateSync<TFieldValues> onStateChange={onStateChange} /> : null}
    </FormProvider>
  );
}
