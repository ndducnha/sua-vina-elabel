import { memo } from "react";
import type { FieldValues } from "react-hook-form";

import { cn } from "@/lib/utils";

import type { FormSectionConfig } from "./types";
import { FormField } from "./FormField";

type FormSectionProps<TFieldValues extends FieldValues> = {
  config: FormSectionConfig<TFieldValues>;
  controlClassName?: string;
  labelClassName?: string;
  fieldGroupClassName?: string;
  sectionTitleClassName?: string;
  sectionContentClassName?: string;
};

const DEFAULT_SECTION_TITLE_CLASS =
  "mb-4 border-b border-border pb-2 text-sm font-bold uppercase tracking-wide text-primary";

const DEFAULT_SECTION_CONTENT_CLASS = "grid grid-cols-1 gap-4 md:grid-cols-2";

function FormSectionInner<TFieldValues extends FieldValues>({
  config,
  controlClassName,
  labelClassName,
  fieldGroupClassName,
  sectionTitleClassName = DEFAULT_SECTION_TITLE_CLASS,
  sectionContentClassName = DEFAULT_SECTION_CONTENT_CLASS,
}: FormSectionProps<TFieldValues>) {
  return (
    <section className={cn(config.sectionClassName)}>
      {config.title ? (
        <h2 className={cn(sectionTitleClassName, config.titleClassName)}>{config.title}</h2>
      ) : null}
      <div className={cn(sectionContentClassName, config.contentClassName)}>
        {config.fields.map((field) => (
          <FormField
            key={field.name}
            config={field}
            controlClassName={controlClassName}
            labelClassName={labelClassName}
            fieldGroupClassName={fieldGroupClassName}
          />
        ))}
      </div>
    </section>
  );
}

export const FormSection = memo(FormSectionInner) as typeof FormSectionInner;
