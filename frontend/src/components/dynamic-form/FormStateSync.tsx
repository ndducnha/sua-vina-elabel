import { useEffect } from "react";
import { useFormContext, useFormState } from "react-hook-form";
import type { FieldValues } from "react-hook-form";

import type { DynamicFormState } from "./types";

type FormStateSyncProps<TFieldValues extends FieldValues> = {
  onStateChange: (state: DynamicFormState<TFieldValues>) => void;
};

/**
 * Headless component that reports form state changes to the parent.
 * Only subscribes to isValid / isSubmitting / isDirty / errors — NOT values.
 * Rendered conditionally when `onStateChange` is provided.
 */
export function FormStateSync<TFieldValues extends FieldValues>({
  onStateChange,
}: FormStateSyncProps<TFieldValues>) {
  const methods = useFormContext<TFieldValues>();
  const { isValid, isSubmitting, isDirty, errors } = useFormState<TFieldValues>();

  useEffect(() => {
    onStateChange({
      isValid,
      isSubmitting,
      isDirty,
      errors,
      methods,
    });
  }, [isValid, isSubmitting, isDirty, errors, onStateChange, methods]);

  return null;
}
