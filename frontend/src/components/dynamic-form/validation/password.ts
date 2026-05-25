import type { TFunction } from "i18next";
import z from "zod";

export function resetPasswordSchema(translate: TFunction) {
  return z
    .string()
    .refine((value) => value.trim().length > 0, {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => value.trim().length >= 8, {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/.test(value), {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => /[A-Z]/.test(value), {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => /[a-z]/.test(value), {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => /[0-9]/.test(value), {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    })
    .refine((value) => !value.includes(" "), {
      message: translate("auth.resetPass.passwordNotMatchRule"),
    });
}
