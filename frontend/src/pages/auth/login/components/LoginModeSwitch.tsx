import { useTranslation } from "react-i18next";

import { LOGIN_MODE, type LoginMode } from "@/constants/Auth";
import { cn } from "@/lib/utils";

type LoginModeSwitchProps = {
  value: LoginMode;
  onChange: (mode: LoginMode) => void;
};

const segmentBase =
  "min-h-10 flex-1 border px-2 py-2 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:px-3 cursor-pointer";

const segmentActive = "border-secondary bg-sky-100 text-primary";
const segmentInactive = "border-transparent bg-white text-muted-foreground hover:bg-slate-50";

export function LoginModeSwitch({ value, onChange }: LoginModeSwitchProps) {
  const { t } = useTranslation();

  return (
    <div className="min-w-0 space-y-4">
      <div
        className="flex w-full overflow-hidden rounded-[10px] border border-slate-200 bg-white shadow-sm"
        role="tablist"
        aria-label={t("auth.loginTitle")}
      >
        <button
          type="button"
          role="tab"
          aria-selected={value === LOGIN_MODE.GTIN}
          className={cn(
            segmentBase,
            "rounded-l-[10px] rounded-r-none border-r-slate-200",
            value === LOGIN_MODE.GTIN ? segmentActive : segmentInactive,
          )}
          onClick={() => onChange(LOGIN_MODE.GTIN)}
        >
          {t("auth.loginModeGtin")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={value === LOGIN_MODE.MANUAL}
          className={cn(
            segmentBase,
            "rounded-l-none rounded-r-[10px]",
            value === LOGIN_MODE.MANUAL ? segmentActive : segmentInactive,
          )}
          onClick={() => onChange(LOGIN_MODE.MANUAL)}
        >
          {t("auth.loginModeManual")}
        </button>
      </div>
    </div>
  );
}
