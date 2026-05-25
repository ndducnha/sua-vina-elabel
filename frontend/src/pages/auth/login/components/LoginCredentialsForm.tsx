import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { LOGIN_MODE, type LoginMode } from "@/constants/Auth";
import { DynamicForm, type DynamicFormSubmitHandler, type FormFieldConfig } from "@/components/dynamic-form";
import { createLoginSchema, type LoginFormValues } from "../hooks/useLogin";

type LoginCredentialsFormProps = {
  loginMode: LoginMode;
  onLoginModeChange: (mode: LoginMode) => void;
  loginSchema: ReturnType<typeof createLoginSchema>;
  formFields: FormFieldConfig<LoginFormValues>[];
  onSubmit: DynamicFormSubmitHandler<LoginFormValues>;
  showLoginLockWarning: boolean;
  defaultValues?: Partial<LoginFormValues>;
};

export function LoginCredentialsForm({
  loginMode,
  onLoginModeChange,
  loginSchema,
  formFields,
  onSubmit,
  showLoginLockWarning,
  defaultValues,
}: LoginCredentialsFormProps) {
  const { t: translate } = useTranslation();

  return (
    <div className="min-w-0 space-y-5">
      <div className="space-y-2">
        <label
          htmlFor="login-mode"
          className="text-sm font-medium text-slate-700"
        >
          {translate("auth.loginModeLabel")}
        </label>
        <select
          id="login-mode"
          value={loginMode}
          onChange={(e) => onLoginModeChange(e.target.value as LoginMode)}
          className="block h-11 w-full rounded-[10px] border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value={LOGIN_MODE.DOMESTIC}>{translate("auth.loginModeDomestic")}</option>
          <option value={LOGIN_MODE.EXPORT}>{translate("auth.loginModeExport")}</option>
        </select>
      </div>

      {showLoginLockWarning ? (
        <div
          role="alert"
          className="rounded-lg border border-amber-500/40 bg-amber-50 px-3 py-2.5 text-sm text-amber-950"
        >
          {translate("auth.loginLockWarning")}
        </div>
      ) : null}

      <DynamicForm<LoginFormValues>
        methodMode="onChange"
        className="min-w-0"
        fields={formFields}
        fieldControlClassName="h-11 border-slate-300 mb-2"
        formOptions={{
          resolver: zodResolver(loginSchema),
          defaultValues,
        }}
        onSubmit={onSubmit}
        hideDefaultSubmit
        renderSubmit={({ isSubmitting }) => (
          <Button
            type="submit"
            className="h-11 w-full rounded-[10px] bg-primary text-white hover:bg-primary/90"
            disabled={isSubmitting}
          >
            {isSubmitting ? translate("common.loading") : translate("auth.loginButton")}
          </Button>
        )}
      />
    </div>
  );
}
