import { useRef } from "react";
import type {
  FieldValues,
  Path,
  PathValue,
  RegisterOptions,
  UseFormGetValues,
  UseFormRegister,
  UseFormSetValue,
} from "react-hook-form";
import { Calendar } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { ddMmYyyyToIso, isoDateToDdMmYyyy } from "./validation";
import type { FormFieldConfig } from "./types";

type DateFormControlProps<TFieldValues extends FieldValues> = {
  field: FormFieldConfig<TFieldValues>;
  mergedControlClass: string | undefined;
  register: UseFormRegister<TFieldValues>;
  setValue: UseFormSetValue<TFieldValues>;
  getValues: UseFormGetValues<TFieldValues>;
  rules: RegisterOptions<TFieldValues, Path<TFieldValues>>;
  hasError?: boolean;
};

export function DateFormControl<TFieldValues extends FieldValues>({
  field,
  mergedControlClass,
  register,
  setValue,
  getValues,
  rules,
  hasError = false,
}: DateFormControlProps<TFieldValues>) {
  const pickerRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    const el = pickerRef.current;
    if (!el || field.disabled) return;
    const current = getValues(field.name);
    const iso = typeof current === "string" ? ddMmYyyyToIso(current) : "";
    el.value = iso;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.click();
      }
    } catch {
      el.click();
    }
  };

  return (
    <div className="relative">
      <Input
        id={field.name}
        type="text"
        inputMode="numeric"
        autoComplete={field.autoComplete ?? "off"}
        placeholder={field.placeholder ?? "dd/MM/yyyy"}
        maxLength={10}
        disabled={field.disabled}
        aria-label={field.hideLabel ? field.label : undefined}
        className={cn("pr-10 [color-scheme:inherit]", mergedControlClass)}
        {...register(field.name, rules)}
        aria-invalid={hasError}
      />
      <input
        ref={pickerRef}
        type="date"
        min={field.datePickerMin}
        max={field.datePickerMax}
        tabIndex={-1}
        className="sr-only"
        aria-hidden
        disabled={field.disabled}
        onChange={(e) => {
          const iso = e.target.value;
          if (!iso) return;
          setValue(field.name, isoDateToDdMmYyyy(iso) as PathValue<TFieldValues, Path<TFieldValues>>, {
            shouldValidate: true,
            shouldDirty: true,
          });
        }}
      />
      <button
        type="button"
        className="cursor-pointer  absolute inset-y-0 right-2 flex items-center justify-center px-0.5 text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50 [&_svg]:block"
        disabled={field.disabled}
        onClick={openPicker}
        aria-label="Open date picker"
      >
        <Calendar className="size-4" />
      </button>
    </div>
  );
}
