import type { FieldValues, Path, RegisterOptions } from "react-hook-form";

import type { FormFieldConfig } from "./types";

/** RHF nests `errors` by path segment; `errors["business.email"]` is always undefined. */
export function getNestedError(
  errors: Record<string, unknown>,
  name: string
): string | undefined {
  const parts = name.split(".");
  let current: unknown = errors;
  for (const segment of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  if (current != null && typeof current === "object" && "message" in current) {
    const messageValue = (current as { message?: unknown }).message;
    return messageValue != null ? String(messageValue) : undefined;
  }
  return undefined;
}

export function buildRules<TFieldValues extends FieldValues>(
  field: FormFieldConfig<TFieldValues>
): RegisterOptions<TFieldValues, Path<TFieldValues>> {
  const rules: RegisterOptions<TFieldValues, Path<TFieldValues>> = {};

  if (typeof field.required === "string") {
    rules.required = field.required;
  } else if (field.required) {
    rules.required = `${field.label} is required`;
  }

  if (field.validator?.pattern) {
    rules.pattern = {
      value: new RegExp(field.validator.pattern),
      message: field.validator.message ?? `${field.label} format is invalid`,
    };
  }

  if (field.validator?.validate) {
    rules.validate = field.validator.validate;
  }

  return rules;
}
