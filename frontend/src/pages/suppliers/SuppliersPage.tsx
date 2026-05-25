import { PageShell, Pill, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { SUPPLIERS } from "@/pages/_internal/fake-data";

export function SuppliersPage() {
  return (
    <PageShell
      title="Nhà cung cấp"
      subtitle="Hợp đồng cung ứng nguyên liệu, bao bì và phụ liệu."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng nhà cung cấp" value={SUPPLIERS.length} />
        <StatCard label="Xếp hạng A" value={SUPPLIERS.filter((s) => s.quality === "A").length} tone="success" />
        <StatCard label="Hợp đồng sắp hết hạn" value={1} tone="warning" delta="Trong 90 ngày tới" />
      </div>

      <SimpleTable
        columns={[
          { key: "code", label: "Mã NCC" },
          { key: "name", label: "Tên nhà cung cấp" },
          { key: "item", label: "Mặt hàng cung cấp" },
          { key: "lead", label: "Lead time" },
          {
            key: "quality",
            label: "Xếp hạng",
            render: (r) => <Pill tone={r.quality === "A" ? "success" : "info"}>{r.quality}</Pill>,
          },
          { key: "contract", label: "Hợp đồng" },
        ]}
        rows={SUPPLIERS}
      />
    </PageShell>
  );
}
