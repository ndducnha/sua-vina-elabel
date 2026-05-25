import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "suavina:product-sync";

type SyncMap = Record<string, string>;

function load(): SyncMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SyncMap) : {};
  } catch {
    return {};
  }
}

function save(map: SyncMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function NationalSyncCell({ productId }: { productId: string }) {
  const { t: translate } = useTranslation();
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const map = load();
    setSyncedAt(map[productId] ?? null);
  }, [productId]);

  const handleClick = async () => {
    if (busy || syncedAt) return;
    setBusy(true);
    // Fake the upstream call to the National Label System
    await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));
    const now = new Date().toISOString();
    const map = load();
    map[productId] = now;
    save(map);
    setSyncedAt(now);
    setBusy(false);
    toast.success(translate("product.table.syncToastSuccess"));
  };

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        {translate("product.table.syncStatusSyncing")}
      </span>
    );
  }

  if (syncedAt) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700"
        title={translate("product.table.syncedAt", {
          time: new Date(syncedAt).toLocaleString("vi-VN"),
        })}
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        {translate("product.table.syncStatusDone")}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 transition hover:border-amber-300 hover:bg-amber-100"
    >
      <CloudUpload className="h-3.5 w-3.5" />
      {translate("product.table.syncStatusPending")}
    </button>
  );
}
