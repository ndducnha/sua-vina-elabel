import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { LOGIN_MODE, type LoginMode } from "@/constants/Auth";

import loginBg from "@/assets/images/auth/login-bg.svg";
import { LoginBranding } from "./components/LoginBranding";
import { LoginCredentialsForm } from "./components/LoginCredentialsForm";
import { LoginVersionBadge } from "./components/LoginVersionBadge";
import { useLogin } from "./hooks/useLogin";
import { loginPageResponsiveClass } from "./responsive";

const DEFAULT_LOGIN: { username: string; password: string } = {
  username: "admin",
  password: "123456",
};

export function LoginPage() {
  const [loginMode, setLoginMode] = useState<LoginMode>(LOGIN_MODE.DOMESTIC);
  const { onSubmit, formFields, loginSchema, showLoginLockWarning } = useLogin(loginMode);

  return (
    <div className="relative min-h-svh">
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-white"
        style={{
          backgroundImage: `url(${loginBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        aria-hidden
      />

      <div className={`relative z-1 flex min-h-svh flex-col ${loginPageResponsiveClass}`}>
        <div className="flex w-full min-w-0 items-center justify-end px-2 pt-1 sm:px-4">
          <LanguageSwitcher />
        </div>

        <div className="mx-auto mt-[6vh] flex w-full min-w-0 max-w-md flex-1 flex-col justify-start gap-6 py-6">
          <div className="rounded-2xl border border-slate-200/70 bg-white/95 px-7 py-8 shadow-xl backdrop-blur-md">
            <LoginBranding />
            <div className="mt-7">
              <LoginCredentialsForm
                loginMode={loginMode}
                onLoginModeChange={setLoginMode}
                loginSchema={loginSchema}
                formFields={formFields}
                onSubmit={onSubmit}
                showLoginLockWarning={showLoginLockWarning}
                defaultValues={DEFAULT_LOGIN}
              />
            </div>
          </div>
        </div>

        <LoginVersionBadge className="absolute bottom-4 right-6 z-1 md:bottom-6 md:right-10" />
      </div>
    </div>
  );
}
