import { useEffect, useState } from "react";

const DEFAULT_CONFIG_URL = "/version.json";

export type AppVersionJson = {
  /** Semantic version, e.g. "1.0.0" (shown as v1.0.0 unless it already starts with "v") */
  version: string;
};

function formatVersionLabel(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  return trimmed.startsWith("v") ? trimmed : `v${trimmed}`;
}

/**
 * Loads version from a public JSON file (default `/version.json`).
 */
export function useAppVersion(configUrl: string = DEFAULT_CONFIG_URL): string | null {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch(configUrl)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<AppVersionJson>;
      })
      .then((data) => {
        if (cancelled || typeof data?.version !== "string") return;
        const formatted = formatVersionLabel(data.version);
        if (formatted) setLabel(formatted);
      })
      .catch(() => {
        /* missing/invalid config — hide badge */
      });

    return () => {
      cancelled = true;
    };
  }, [configUrl]);

  return label;
}
