import logoVina from "@/assets/images/commons/logo-vina.svg";
import { useTranslation } from "react-i18next";

import { loginBrandingTitleResponsiveClass } from "../responsive";

type LoginBrandingProps = {
  hideSystemTitle?: boolean;
};

export function LoginBranding({ hideSystemTitle = false }: LoginBrandingProps) {
  const { t: translate } = useTranslation();

  return (
    <div className="flex min-w-0 flex-col items-center space-y-4 text-center">
      <img src={logoVina} alt="Sữa Vina" className="h-14 w-auto object-contain" decoding="async" />
      {!hideSystemTitle && (
        <h1
          className={`font-bold leading-tight tracking-tight text-slate-900 ${loginBrandingTitleResponsiveClass}`}
        >
          <span className="block">{translate("auth.loginSystemTitleLine1")}</span>
          <span className="block text-primary">{translate("auth.loginSystemTitleLine2")}</span>
        </h1>
      )}
      <p className="text-sm text-slate-500">{translate("auth.loginBrandSubtitle")}</p>
    </div>
  );
}
