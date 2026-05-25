import { useCallback, useMemo, useState } from "react";
import type { TFunction } from "i18next";
import { useNavigate, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { fetchCurrentUser, submitLoginGS1 } from "@/api/auth";
import { resolvePostLoginPath } from "@/lib/auth-logout";
import { prepareAuthPersistenceForLogin } from "@/lib/auth-storage";
import { useAuthStore } from "@/stores/auth.store";
import { submitLogin } from "@/api/auth";
import {
  FORM_FIELD_TYPE,
  type DynamicFormSubmitHandler,
  type FormFieldConfig,
} from "@/components/dynamic-form";
import { LOGIN_MODE, type LoginMode } from "@/constants";

/** Keeps submit in a loading state at least this long so fast API responses cannot be spam-submitted. */
const MIN_LOGIN_SUBMIT_MS = 400;

function ensureMinElapsed(startedAt: number, minMs: number): Promise<void> {
  const elapsed = Date.now() - startedAt;
  if (elapsed >= minMs) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, minMs - elapsed));
}

export function createLoginSchema(t: TFunction) {
  return z.object({
    username: z.string().min(1, t("auth.usernameRequired")),
    password: z.string().min(1, t("auth.passwordRequired")),
  });
}

export type LoginFormValues = z.infer<ReturnType<typeof createLoginSchema>>;

export function useLogin(mode: LoginMode) {
  const { t: translate, i18n } = useTranslation();
  const loginSchema = useMemo(() => createLoginSchema(translate), [translate, i18n.language]);
  const navigate = useNavigate();
  const location = useLocation();
  const loginStore = useAuthStore((state) => state.login);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);

  const [rememberMe, setRememberMe] = useState(false);
  /** Counts failed submitLogin attempts; warning shown from the 2nd failure onward. */
  const [failedLoginAttempts, setFailedLoginAttempts] = useState(0);

  const redirectPath = useMemo(() => {
    const from = (location.state as { from?: Location })?.from?.pathname;
    return resolvePostLoginPath(from);
  }, [location.state]);

  const formFields = useMemo((): FormFieldConfig<LoginFormValues>[] => {
    return [
      {
        type: FORM_FIELD_TYPE.TEXT,
        name: "username",
        label: translate("auth.username"),
        hideLabel: false,
        placeholder: translate("auth.usernamePlaceholder"),
        labelInfoTooltip:
          mode === LOGIN_MODE.MANUAL
            ? translate("auth.loginUsernameInfoTooltipManual")
            : translate("auth.loginUsernameInfoTooltip"),
      },
      {
        type: FORM_FIELD_TYPE.PASSWORD,
        name: "password",
        label: translate("auth.password"),
        hideLabel: false,
        placeholder: translate("auth.passwordPlaceholder"),
      },
    ];
  }, [translate, i18n.language, mode]);

  const onSubmit = useCallback<DynamicFormSubmitHandler<LoginFormValues>>(
    async (credentials) => {
      const startedAt = Date.now();
      try {
        prepareAuthPersistenceForLogin(rememberMe);
        const response =
          mode === LOGIN_MODE.GTIN
            ? await submitLoginGS1(credentials)
            : await submitLogin(credentials);
        const payload = response.data.data;
        if (!payload.access_token || !payload.refresh_token) {
          throw new Error("Invalid login response: missing tokens");
        }
        loginStore({
          accessToken: payload.access_token,
          refreshToken: payload.refresh_token,
        });
        try {
          const user = await fetchCurrentUser();
          setUser(user);
        } catch {
          logout();
          await ensureMinElapsed(startedAt, MIN_LOGIN_SUBMIT_MS);
          return;
        }
        setFailedLoginAttempts(0);
        await ensureMinElapsed(startedAt, MIN_LOGIN_SUBMIT_MS);
        navigate(redirectPath, { replace: true });
      } catch {
        await ensureMinElapsed(startedAt, MIN_LOGIN_SUBMIT_MS);
        setFailedLoginAttempts((n) => n + 1);
      }
    },
    [loginStore, logout, mode, navigate, redirectPath, rememberMe, setUser]
  );

  const showLoginLockWarning = failedLoginAttempts >= 2;

  return {
    rememberMe,
    setRememberMe,
    onSubmit,
    formFields,
    loginSchema,
    showLoginLockWarning,
  };
}
