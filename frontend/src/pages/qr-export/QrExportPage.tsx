import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, FileText, Loader2, QrCode, Printer } from "lucide-react";
import QRCode from "qrcode";
import JSZip from "jszip";
import jsPDF from "jspdf";
import { toast } from "sonner";
import axiosInstance from "@/api/interceptors/axios-instance";
import { API_ENDPOINTS } from "@/api/endpoints";
import { PageShell } from "@/pages/_internal/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductDetail = {
  id: string;
  gtin?: string | null;
  sku?: string | null;
  name: string;
  brand?: string | null;
  taxCode?: string | null;
  tax_code?: string | null;
};

type BatchSummary = { id: string; batch_code: string; manufacturing_date?: string | null; total_quantity?: number };

function fieldOf(obj: Record<string, unknown> | null | undefined, ...keys: string[]): string | null {
  if (!obj) return null;
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

// Landing host comes from .env (VITE_ELABEL_LANDING_BASE_URL) or falls back to the
// host the user is currently viewing (replacing port 3000 → 3002).
function landingBase(): string {
  const fromEnv = (import.meta.env.VITE_ELABEL_LANDING_BASE_URL as string | undefined)?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (typeof window !== "undefined") {
    return window.location.origin.replace(/:3000$/, ":3002");
  }
  return "http://127.0.0.1:3002";
}

function buildPublicUrl(gtin: string, taxCode: string, batchCode?: string): string {
  const base = landingBase();
  const lot = batchCode ? `/10/${encodeURIComponent(batchCode)}` : "";
  return `${base}/01/${encodeURIComponent(gtin)}${lot}?tax_code=${encodeURIComponent(taxCode)}`;
}

export function QrExportPage() {
  const { productId } = useParams<{ productId: string }>();

  const productQ = useQuery({
    queryKey: ["product-detail-qr", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.DETAIL(productId!));
      return res.data?.data as ProductDetail;
    },
    enabled: !!productId,
  });

  const batchesQ = useQuery({
    queryKey: ["product-batches-qr", productId],
    queryFn: async () => {
      const res = await axiosInstance.get(API_ENDPOINTS.PRODUCTS.PRODUCT_BATCHES(productId!));
      const data = res.data?.data;
      const list: any[] = Array.isArray(data) ? data : data?.items ?? [];
      return list.map((b) => ({
        id: String(b.id),
        batch_code: String(b.batchCode ?? b.batch_code ?? ""),
        manufacturing_date: b.manufacturingDate ?? b.manufacturing_date ?? null,
        total_quantity: Number(b.totalQuantity ?? b.total_quantity ?? 0),
      })) as BatchSummary[];
    },
    enabled: !!productId,
  });

  const product = productQ.data;
  const batches = batchesQ.data ?? [];

  const [selectedBatch, setSelectedBatch] = useState<string>(""); // "" = product-level (no lot)
  const [quantity, setQuantity] = useState<number>(50);
  const [sizePx, setSizePx] = useState<number>(512);
  const [busy, setBusy] = useState<null | "png" | "zip" | "pdf">(null);
  const [previewDataUrl, setPreviewDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (batches.length > 0 && !selectedBatch) setSelectedBatch(batches[0].id);
  }, [batches, selectedBatch]);

  const activeBatch = useMemo(
    () => batches.find((b) => b.id === selectedBatch) ?? null,
    [batches, selectedBatch],
  );

  const publicUrl = useMemo(() => {
    const gtin = fieldOf(product as unknown as Record<string, unknown> | null, "gtin");
    const taxCode = fieldOf(product as unknown as Record<string, unknown> | null, "taxCode", "tax_code");
    if (!gtin || !taxCode) return "";
    return buildPublicUrl(gtin, taxCode, activeBatch?.batch_code);
  }, [product, activeBatch]);

  // Generate preview QR
  useEffect(() => {
    if (!publicUrl) {
      setPreviewDataUrl(null);
      return;
    }
    QRCode.toDataURL(publicUrl, { width: 256, margin: 2, errorCorrectionLevel: "M" })
      .then(setPreviewDataUrl)
      .catch(() => setPreviewDataUrl(null));
  }, [publicUrl]);

  async function makePng(): Promise<Blob> {
    const dataUrl = await QRCode.toDataURL(publicUrl, { width: sizePx, margin: 2, errorCorrectionLevel: "M" });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  async function handleDownloadPng() {
    if (!publicUrl) return;
    setBusy("png");
    try {
      const blob = await makePng();
      saveBlob(blob, `qr-${product?.gtin}-${activeBatch?.batch_code ?? "product"}.png`);
      toast.success("Đã tải PNG");
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadZip() {
    if (!publicUrl) return;
    setBusy("zip");
    try {
      const zip = new JSZip();
      const labelPrefix = activeBatch?.batch_code ?? "product";
      // All QRs in this bundle encode the same URL (one per serialised unit on the line)
      const pngBlob = await makePng();
      const pngBuffer = await pngBlob.arrayBuffer();
      const folder = zip.folder(`qr-${product?.gtin}-${labelPrefix}`)!;
      folder.file("README.txt",
        `Bộ QR cho sản phẩm: ${product?.name}\n` +
        `GTIN: ${product?.gtin}\n` +
        `Lô: ${activeBatch?.batch_code ?? "(toàn sản phẩm)"}\n` +
        `Số lượng: ${quantity}\n` +
        `URL truy xuất: ${publicUrl}\n`);
      for (let i = 1; i <= quantity; i++) {
        const name = `qr-${String(i).padStart(4, "0")}.png`;
        folder.file(name, pngBuffer);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveBlob(blob, `qr-bundle-${product?.gtin}-${labelPrefix}.zip`);
      toast.success(`Đã tạo ZIP với ${quantity} QR`);
    } finally {
      setBusy(null);
    }
  }

  async function handleDownloadPdf() {
    if (!publicUrl) return;
    setBusy("pdf");
    try {
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageW = 210, pageH = 297;
      const cols = 4, rows = 6;
      const perPage = cols * rows;
      const marginX = 10, marginY = 15;
      const cellW = (pageW - 2 * marginX) / cols;
      const cellH = (pageH - 2 * marginY) / rows;
      const qrDataUrl = await QRCode.toDataURL(publicUrl, { width: 600, margin: 1, errorCorrectionLevel: "M" });

      let count = 0;
      let page = 1;
      while (count < quantity) {
        if (count > 0 && count % perPage === 0) {
          doc.addPage();
          page++;
        }
        const indexInPage = count % perPage;
        const col = indexInPage % cols;
        const row = Math.floor(indexInPage / cols);
        const x = marginX + col * cellW;
        const y = marginY + row * cellH;
        const qrSize = Math.min(cellW, cellH) - 12;
        const qrX = x + (cellW - qrSize) / 2;
        const qrY = y + 2;
        doc.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);
        doc.setFontSize(7);
        doc.text(product?.name?.slice(0, 28) ?? "", x + cellW / 2, qrY + qrSize + 3, { align: "center" });
        doc.setFontSize(6);
        doc.text(`${product?.gtin}${activeBatch ? "  ·  " + activeBatch.batch_code : ""}`, x + cellW / 2, qrY + qrSize + 6.5, { align: "center" });
        count++;
      }

      // Footer on each page
      const totalPages = page;
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Sữa Vina · ${product?.name ?? ""} · trang ${p}/${totalPages}`, pageW / 2, pageH - 6, { align: "center" });
      }

      doc.save(`qr-print-${product?.gtin}-${activeBatch?.batch_code ?? "product"}.pdf`);
      toast.success(`Đã tạo PDF in ${quantity} nhãn`);
    } finally {
      setBusy(null);
    }
  }

  if (!productId) return <PageShell title="Xuất nhãn QR"><p>Thiếu mã sản phẩm.</p></PageShell>;
  if (productQ.isLoading) return <PageShell title="Xuất nhãn QR"><Loader2 className="h-5 w-5 animate-spin" /></PageShell>;
  if (!product) return <PageShell title="Xuất nhãn QR"><p>Không tìm thấy sản phẩm.</p></PageShell>;

  return (
    <PageShell
      title="Xuất nhãn QR để in"
      subtitle={`${product.name} · GTIN ${product.gtin ?? "—"}`}
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: config */}
        <div className="lg:col-span-2 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">1. Chọn lô để in QR</h3>
            <p className="mt-1 text-xs text-slate-500">
              Mỗi QR sẽ trỏ về trang truy xuất công khai trên cổng Sữa Vina.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${selectedBatch === "" ? "border-primary bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                <input type="radio" checked={selectedBatch === ""} onChange={() => setSelectedBatch("")} className="mt-0.5 accent-primary" />
                <span>
                  <span className="block font-medium text-slate-900">Toàn sản phẩm</span>
                  <span className="block text-xs text-slate-500">QR dẫn về trang sản phẩm (không gắn lô).</span>
                </span>
              </label>
              {batches.map((b) => (
                <label key={b.id} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${selectedBatch === b.id ? "border-primary bg-blue-50" : "border-slate-200 hover:bg-slate-50"}`}>
                  <input type="radio" checked={selectedBatch === b.id} onChange={() => setSelectedBatch(b.id)} className="mt-0.5 accent-primary" />
                  <span>
                    <span className="block font-medium text-slate-900">Lô {b.batch_code}</span>
                    <span className="block text-xs text-slate-500">
                      NSX {b.manufacturing_date ?? "—"} · {b.total_quantity?.toLocaleString("vi-VN") ?? "—"} đơn vị
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">2. Tuỳ chỉnh xuất</h3>
            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label className="text-sm">Số lượng nhãn cần in</Label>
                <Input type="number" min={1} max={5000} value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Math.min(5000, parseInt(e.target.value) || 1)))}
                  className="mt-1 h-10" />
                <p className="mt-1 text-xs text-slate-400">Tối đa 5.000 nhãn/file để giữ file ZIP/PDF gọn.</p>
              </div>
              <div>
                <Label className="text-sm">Độ phân giải PNG (px)</Label>
                <select value={sizePx} onChange={(e) => setSizePx(parseInt(e.target.value))}
                  className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm">
                  <option value={256}>256 × 256 (web)</option>
                  <option value={512}>512 × 512 (in laser)</option>
                  <option value={1024}>1024 × 1024 (in offset)</option>
                </select>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600 break-all">
              {publicUrl || "(thiếu GTIN hoặc tax_code)"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">3. Tải xuống</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button onClick={handleDownloadPng} disabled={!publicUrl || busy !== null}
                className="h-12 justify-start bg-white text-slate-900 border border-slate-300 hover:bg-slate-50">
                {busy === "png" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <QrCode className="mr-2 h-4 w-4 text-primary" />}
                <span className="flex-1 text-left">
                  <span className="block font-medium">Tải 1 PNG</span>
                  <span className="block text-xs text-slate-500">Ảnh QR đơn lẻ</span>
                </span>
              </Button>
              <Button onClick={handleDownloadZip} disabled={!publicUrl || busy !== null}
                className="h-12 justify-start bg-white text-slate-900 border border-slate-300 hover:bg-slate-50">
                {busy === "zip" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4 text-primary" />}
                <span className="flex-1 text-left">
                  <span className="block font-medium">Tải ZIP × {quantity}</span>
                  <span className="block text-xs text-slate-500">Bộ PNG cho dây chuyền</span>
                </span>
              </Button>
              <Button onClick={handleDownloadPdf} disabled={!publicUrl || busy !== null}
                className="h-12 justify-start bg-primary text-white hover:bg-primary/90">
                {busy === "pdf" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                <span className="flex-1 text-left">
                  <span className="block font-medium">PDF in A4 ({quantity})</span>
                  <span className="block text-xs text-blue-100">4×6 nhãn/trang, kèm tên SP</span>
                </span>
              </Button>
            </div>
            <p className="mt-3 inline-flex items-center gap-1 text-xs text-slate-500">
              <Printer className="h-3 w-3" /> File được sinh phía trình duyệt — không có dữ liệu rời máy.
            </p>
          </div>
        </div>

        {/* Right: preview */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm text-center">
            <h3 className="text-sm font-semibold text-slate-900">Xem trước nhãn QR</h3>
            <div className="mt-4 flex items-center justify-center rounded-xl bg-slate-50 p-6">
              {previewDataUrl ? (
                <img src={previewDataUrl} alt="QR preview" className="h-56 w-56 rounded-md bg-white p-2 shadow-sm" />
              ) : (
                <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
              )}
            </div>
            <p className="mt-3 text-xs font-medium text-slate-700">{product.name}</p>
            <p className="text-xs text-slate-400">
              GTIN {product.gtin}
              {activeBatch ? ` · Lô ${activeBatch.batch_code}` : ""}
            </p>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
