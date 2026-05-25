import { useFormContext, useFormState } from "react-hook-form";
import type { ReactNode, } from "react";
import type { FieldValues } from "react-hook-form";

import { Button } from "@/components/ui/button";

import type { DynamicFormState } from "./types";

type FormSubmitAreaProps<TFieldValues extends FieldValues> = {
  submitLabel?: string;
  hideDefaultSubmit?: boolean;
  renderSubmit?: (state: DynamicFormState<TFieldValues>) => ReactNode;
};

export function FormSubmitArea<TFieldValues extends FieldValues>({
  submitLabel = "Submit",
  hideDefaultSubmit = false,
  renderSubmit,
}: FormSubmitAreaProps<TFieldValues>) {
  const methods = useFormContext<TFieldValues>();
  // Only subscribe to isSubmitting, isValid, isDirty, errors — NOT values
  const { isSubmitting, isValid, isDirty, errors } = useFormState<TFieldValues>();

  const statePayload: DynamicFormState<TFieldValues> = {
    isSubmitting,
    isValid,
    isDirty,
    errors,
    methods,
  };

  return (
    <>
      {renderSubmit?.(statePayload)}

      {!hideDefaultSubmit ? (
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Loading..." : submitLabel}
        </Button>
      ) : null}
    </>
  );
}
