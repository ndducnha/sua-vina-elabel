import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { ChevronDown, Globe } from "lucide-react";

const languages = [
  { code: "vi" as const, labelKey: "common.languageVi" as const, iso: "vn" },
  { code: "en" as const, labelKey: "common.languageEn" as const, iso: "gb" },
];

// const imgTriggerClass = "h-5 w-auto max-w-none shrink-0 object-cover";
// const imgMenuClass = "h-4 w-auto max-w-none shrink-0 object-cover";

function normalizeLang(code: string): "vi" | "en" {
  return code.startsWith("en") ? "en" : "vi";
}

export function LanguageSwitcher({
  triggerClassName,
  menuClassName,
}: {
  triggerClassName?: string;
  menuClassName?: string;
}) {
  const { i18n, t } = useTranslation();

  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem("language", languageCode);
  };

  const activeCode = normalizeLang(i18n.language);
  // const current = languages.find((option) => option.code === activeCode) ?? languages[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            aria-label={t("common.language")}
            className={cn("h-auto min-h-0 w-auto shrink-0 gap-1 rounded-sm border-0 bg-transparent px-2 py-2 shadow-none transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50", triggerClassName)}
          >
            {/* <img src={lipisFlag4x3Url(current.iso)} alt="" className={imgTriggerClass} decoding="async" /> */}
            <Globe className="size-4 shrink-0 opacity-70" aria-hidden />
            <ChevronDown className="size-4 shrink-0 opacity-70" aria-hidden />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn("gap-3", activeCode === lang.code && "bg-accent", menuClassName)}
          >
            {/* <img src={lipisFlag4x3Url(lang.iso)} alt="" className={imgMenuClass} decoding="async" /> */}
            <span className="font-medium px-2 rounded w-6">{t(lang.code.toLocaleUpperCase())}</span>
            <span className="font-medium">{t(lang.labelKey)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
