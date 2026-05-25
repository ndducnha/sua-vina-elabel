import { PageShell, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { REPORT_CARDS, REPORT_TOP_PRODUCTS } from "@/pages/_internal/fake-data";

export function ReportsPage() {
  return (
    <PageShell
      title="Báo cáo & Thống kê"
      subtitle="Tổng quan vận hành tháng 5 năm 2026."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {REPORT_CARDS.map((c) => (
          <StatCard key={c.label} label={c.label} value={c.value} delta={c.delta} tone={c.tone} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Fake bar chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Doanh thu theo tháng (12 tháng gần nhất)</h3>
          <p className="text-xs text-slate-500">Đơn vị: tỷ VNĐ</p>
          <div className="mt-4 grid grid-cols-12 items-end gap-2" style={{ height: 192 }}>
            {[28, 31, 33, 30, 36, 39, 41, 38, 42, 45, 44, 48].map((v, i) => (
              <div key={i} className="flex h-full flex-col items-center justify-end gap-1">
                <div
                  className="w-full rounded-t bg-gradient-to-t from-blue-500 to-blue-300"
                  style={{ height: `${Math.round((v / 50) * 170)}px` }}
                  title={`${v} tỷ`}
                />
                <span className="text-[10px] text-slate-400">T{i + 6 > 12 ? i + 6 - 12 : i + 6}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900">Top sản phẩm theo doanh thu</h3>
          <ol className="mt-4 space-y-3 text-sm">
            {REPORT_TOP_PRODUCTS.map((p) => (
              <li key={p.rank} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700">
                    {p.rank}
                  </span>
                  <span className="text-slate-700">{p.product}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{p.revenue}</p>
                  <p className="text-[11px] text-slate-400">{p.share}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Lịch sử kiểm tra QA/QC gần đây</h3>
        <SimpleTable
          columns={[
            { key: "date", label: "Ngày kiểm" },
            { key: "lot", label: "Lô" },
            { key: "param", label: "Chỉ tiêu" },
            { key: "result", label: "Kết quả" },
          ]}
          rows={[
            { date: "23/05/2026", lot: "LOT-2026-05-021", param: "Độ béo, khuẩn lạc", result: "Đạt" },
            { date: "23/05/2026", lot: "LOT-2026-05-023", param: "pH, men sống", result: "Giữ - kiểm lại" },
            { date: "22/05/2026", lot: "LOT-2026-05-018", param: "Độ ngọt, kim loại nặng", result: "Đạt" },
            { date: "21/05/2026", lot: "LOT-2026-05-016", param: "Tổng số vi sinh", result: "Đạt" },
          ]}
        />
      </div>
    </PageShell>
  );
}
