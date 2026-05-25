import { memo, useState } from "react";
import { useFormContext } from "react-hook-form";
import type { FieldValues, Path } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { FormFieldConfig } from "./types";
import { buildRules } from "./utils";

type PasswordFieldProps<TFieldValues extends FieldValues> = {
  config: FormFieldConfig<TFieldValues>;
  controlClassName?: string;
  hasError?: boolean;
};

function PasswordFieldInner<TFieldValues extends FieldValues>({
  config,
  controlClassName,
  hasError = false,
}: PasswordFieldProps<TFieldValues>) {
  const { register } = useFormContext<TFieldValues>();
  const [visible, setVisible] = useState(false);
  const rules = buildRules(config);
  const mergedClass = cn(controlClassName, config.controlClassName);

  return (
    <div className="relative">
      <Input
        id={config.name}
        type={visible ? "text" : "password"}
        placeholder={config.placeholder}
        autoComplete={config.autoComplete}
        disabled={config.disabled}
        aria-label={config.hideLabel ? config.label : undefined}
        className={cn("pr-10", mergedClass)}
        maxLength={config.maxLength}
        {...register(config.name as Path<TFieldValues>, rules)}
        aria-invalid={hasError}
      />
      <button
        type="button"
        className="absolute inset-y-0 right-1.5 bottom-1 flex w-8 cursor-pointer items-center justify-center text-muted-foreground hover:text-foreground"
        disabled={config.disabled}
        onClick={() => setVisible((prev) => !prev)}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

export const PasswordField = memo(PasswordFieldInner) as typeof PasswordFieldInner;
