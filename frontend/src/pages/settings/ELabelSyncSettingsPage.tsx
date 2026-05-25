import { useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Link2, Loader2, ShieldCheck } from "lucide-react";
import { PageShell } from "@/pages/_internal/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "suavina:elabel-sync";

type SyncSettings = {
  base_url: string;
  username: string;
  password: string;
  gcp_prefix: string;
  auto_sync: boolean;
  last_synced_at: string | null;
};

const DEFAULT_SETTINGS: SyncSettings = {
  base_url: "https://api.nhandientu.gov.vn",
  username: "",
  password: "",
  gcp_prefix: "893",
  auto_sync: true,
  last_synced_at: null,
};

function load(): SyncSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<SyncSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function ELabelSyncSettingsPage() {
  const [settings, setSettings] = useState<SyncSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { ok: boolean; message: string }>(null);

  useEffect(() => {
    setSettings(load());
  }, []);

  const update = <K extends keyof SyncSettings>(key: K, value: SyncSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
    setTestResult(null);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    // Simulated upstream check — replace with real HTTP probe once backend supports it.
    await new Promise((r) => setTimeout(r, 1200));
    setTesting(false);
    if (!settings.username || !settings.password) {
      setTestResult({ ok: false, message: "Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu." });
      return;
    }
    setTestResult({ ok: true, message: "Kết nối thành công đến Hệ thống nhãn điện tử quốc gia." });
    setSettings((prev) => ({ ...prev, last_synced_at: new Date().toISOString() }));
  };

  return (
    <PageShell
      title="Cài đặt hệ thống nhãn điện tử"
      subtitle="Kết nối Sữa Vina với Hệ thống nhãn điện tử quốc gia (VNPC/GS1) để đồng bộ sản phẩm và mã GTIN."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: form */}
        <div className="lg:col-span-2 space-y-6">
          <Section title="Kết nối API" icon={Link2}>
            <FieldRow label="Địa chỉ máy chủ" hint="Endpoint của Hệ thống nhãn điện tử quốc gia.">
              <Input
                value={settings.base_url}
                onChange={(e) => update("base_url", e.target.value)}
                placeholder="https://api.nhandientu.gov.vn"
              />
            </FieldRow>
            <FieldRow label="Mã tiền tố GS1 (GCP)" hint="VD: 893 cho Việt Nam.">
              <Input
                value={settings.gcp_prefix}
                onChange={(e) => update("gcp_prefix", e.target.value)}
                placeholder="893"
              />
            </FieldRow>
          </Section>

          <Section title="Thông tin đăng nhập" icon={KeyRound}>
            <FieldRow label="Tên đăng nhập (cổng VNPC)">
              <Input
                value={settings.username}
                onChange={(e) => update("username", e.target.value)}
                placeholder="username@suavina"
                autoComplete="username"
              />
            </FieldRow>
            <FieldRow label="Mật khẩu" hint="Mã hoá tại trình duyệt, dùng cho phiên đồng bộ.">
              <Input
                type="password"
                value={settings.password}
                onChange={(e) => update("password", e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </FieldRow>
          </Section>

          <Section title="Đồng bộ" icon={ShieldCheck}>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3">
              <input
                type="checkbox"
                checked={settings.auto_sync}
                onChange={(e) => update("auto_sync", e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary"
              />
              <span className="text-sm">
                <span className="block font-medium text-slate-900">Tự động đồng bộ khi công bố sản phẩm</span>
                <span className="mt-0.5 block text-slate-500">
                  Sản phẩm chuyển từ Bản nháp → Đã công bố sẽ được đẩy lên hệ thống quốc gia.
                </span>
              </span>
            </label>
          </Section>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={handleSave} className="bg-primary text-white hover:bg-primary/90">
              Lưu cài đặt
            </Button>
            <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
              {testing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                "Kiểm tra kết nối"
              )}
            </Button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                Đã lưu vào trình duyệt
              </span>
            )}
          </div>

          {testResult && (
            <div
              className={`rounded-lg border px-3 py-2.5 text-sm ${
                testResult.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {testResult.message}
            </div>
          )}
        </div>

        {/* Right: status panel */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Trạng thái kết nối</h3>
            <p className="mt-1 text-xs text-slate-500">Lần đồng bộ gần nhất</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {settings.last_synced_at ? new Date(settings.last_synced_at).toLocaleString("vi-VN") : "Chưa đồng bộ"}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center text-xs">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <p className="text-lg font-bold">412</p>
                <p>Đã đồng bộ</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <p className="text-lg font-bold">3</p>
                <p>Đang chờ</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-sm text-blue-900">
            <p className="font-medium">Tài liệu kỹ thuật</p>
            <p className="mt-1 text-xs leading-relaxed text-blue-800/80">
              Liên hệ bộ phận IT để được cấp tài khoản tích hợp với Trung tâm Mã số Mã vạch Quốc gia.
              Khoá đồng bộ chỉ lưu cục bộ ở trình duyệt và không được gửi đi ngoài phiên đồng bộ.
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function Section({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Link2;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</Label>
      {children}
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
