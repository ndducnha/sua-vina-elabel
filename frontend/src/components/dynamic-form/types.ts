import type { ReactNode } from "react";
import type { FieldValues, FieldErrors, Path, RegisterOptions, UseFormReturn, UseFormProps } from "react-hook-form";

/** Visual + behaviour for fields with multi-phase validation (e.g. traceability URL). */
export const FIELD_VALIDATION_PHASE = {
  NEUTRAL: "neutral",
  ERROR: "error",
  WARNING: "warning",
  SUCCESS: "success",
} as const;

export type FieldValidationPhase =
  (typeof FIELD_VALIDATION_PHASE)[keyof typeof FIELD_VALIDATION_PHASE];

export type FieldValidationState = {
  phase: FieldValidationPhase;
  /** Shown below the control when `phase` is error (if no RHF message) or warning. */
  message?: string;
};

export const FORM_FIELD_TYPE = {
  TEXT: "text",
  PASSWORD: "password",
  DATE: "date",
  SELECT: "select",
  AREA: "area",
} as const;

export type FormFieldType = (typeof FORM_FIELD_TYPE)[keyof typeof FORM_FIELD_TYPE];

export type FormSelectOption = {
  label: string;
  value: string;
};

export type FieldValidator<TFieldValues extends FieldValues = FieldValues> = {
  pattern?: string;
  message?: string;
  validate?: RegisterOptions<TFieldValues>["validate"];
};

export type TextAsyncValidationConfig<TFieldValues extends FieldValues = FieldValues> = {
  /** Milliseconds to wait after the last keystroke before calling `validate`. */
  debounceMs: number;
  /**
   * `value` is the debounced string from the field. Return `true` if valid, or a user-facing error
   * message. Pass `signal` to `fetch` / axios so in-flight work is cancelled when the value changes.
   */
  validate: (
    value: string,
    context: { methods: UseFormReturn<TFieldValues>; signal: AbortSignal }
  ) => Promise<true | string>;
  /** Shown in muted text under the field while a validation request is in flight. */
  validatingMessage?: string;
};

export type FormFieldConfig<TFieldValues extends FieldValues = FieldValues> = {
  type: FormFieldType;
  name: Path<TFieldValues>;
  label: string;
  hideLabel?: boolean;
  placeholder?: string;
  required?: boolean | string;
  disabled?: boolean;
  options?: FormSelectOption[];
  validator?: FieldValidator<TFieldValues>;
  /** Wrapper class for the field cell in a grid (e.g. `md:col-span-2`). */
  wrapperClassName?: string;
  /** Extra classes merged into the input/select (after form-level `fieldControlClassName`). */
  controlClassName?: string;
  /** Shown beside the label in italics; if `hideLabel`, shown below the control. */
  hint?: string;
  labelInfoTooltip?: string;
  labelClassName?: string;
  autoComplete?: string;
  /** Overrides `<Input type="...">`; defaults from field `type` (password uses the visibility toggle). */
  inputType?: string;
  maxLength?: number;
  datePickerMin?: string;
  datePickerMax?: string;
  /**
   * Multi-phase validation (warning / success borders). RHF `errors[name]` still controls hard
   * errors and submit validity. Combine with `fieldValidationDependencies` so this field
   * re-renders when other inputs change (e.g. batch series vs URL lot).
   */
  getFieldValidationState?: (
    methods: UseFormReturn<TFieldValues>,
  ) => FieldValidationState | null | undefined;
  /** Re-run `getFieldValidationState` when these values change (plus `name`). */
  fieldValidationDependencies?: Path<TFieldValues>[];
  /**
   * Debounced async check for text inputs (e.g. uniqueness). On success, clears the field and
   * re-runs schema `trigger`. On failure, sets RHF `setError` with `type: "async"`.
   */
  textAsyncValidation?: TextAsyncValidationConfig<TFieldValues>;
};

export type FormSectionConfig<TFieldValues extends FieldValues = FieldValues> = {
  block: "section";
  title?: string;
  sectionClassName?: string;
  titleClassName?: string;
  /** Classes for the field container (default: responsive two-column grid). */
  contentClassName?: string;
  fields: FormFieldConfig<TFieldValues>[];
};

export type DynamicFormLayoutItem<TFieldValues extends FieldValues = FieldValues> =
  | FormFieldConfig<TFieldValues>
  | FormSectionConfig<TFieldValues>;

export type DynamicFormState<TFieldValues extends FieldValues = FieldValues> = {
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  errors: FieldErrors<TFieldValues>;
  methods: UseFormReturn<TFieldValues>;
};

/** Handlers may omit `methods`; a single-argument `(data) => ...` is still valid in TypeScript. */
export type DynamicFormSubmitHandler<TFieldValues extends FieldValues = FieldValues> = (
  data: TFieldValues,
  methods: UseFormReturn<TFieldValues>,
) => void | Promise<void>;

export type DynamicFormProps<TFieldValues extends FieldValues = FieldValues> = {
  id?: string;
  fields: DynamicFormLayoutItem<TFieldValues>[];
  formOptions?: UseFormProps<TFieldValues>;
  /** Applied to every input/select; each field may add `controlClassName`. */
  fieldControlClassName?: string;
  /** Default `<Label>` class; a field can override with `labelClassName`. */
  labelClassName?: string;
  /** Wrapper class for label + control + hint + error (default `space-y-2`). */
  fieldGroupClassName?: string;
  /** Default section heading class when a section block has no `titleClassName`. */
  sectionTitleClassName?: string;
  /** Default inner grid/layout for sections when the block omits `contentClassName`. */
  sectionContentClassName?: string;
  submitLabel?: string;
  className?: string;
  footer?: ReactNode;
  hideDefaultSubmit?: boolean;
  disableDefaultSpacing?: boolean;
  methodMode?: string;
  renderSubmit?: (state: DynamicFormState<TFieldValues>) => ReactNode;
  onStateChange?: (state: DynamicFormState<TFieldValues>) => void;
  onSubmit: DynamicFormSubmitHandler<TFieldValues>;
};
