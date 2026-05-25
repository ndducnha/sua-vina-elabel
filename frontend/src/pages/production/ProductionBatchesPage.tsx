import { PageShell, Pill, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PRODUCTION_BATCHES } from "@/pages/_internal/fake-data";

const statusTone: Record<string, "success" | "info" | "warning" | "neutral"> = {
  completed: "success",
  running: "info",
  qc_hold: "warning",
  scheduled: "neutral",
};
const statusLabel: Record<string, string> = {
  completed: "Hoàn thành",
  running: "Đang chạy",
  qc_hold: "Giữ QA/QC",
  scheduled: "Đã lên lịch",
};

export function ProductionBatchesPage() {
  return (
    <PageShell
      title="Lô sản xuất"
      subtitle="Quản lý chu kỳ sản xuất và truy xuất nguồn gốc theo lô."
      actions={
        <Button className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> Tạo lô sản xuất
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Lô đang chạy" value={PRODUCTION_BATCHES.filter((b) => b.status === "running").length} tone="info" />
        <StatCard label="Hoàn thành tuần này" value={PRODUCTION_BATCHES.filter((b) => b.status === "completed").length} tone="success" />
        <StatCard label="Giữ QC" value={PRODUCTION_BATCHES.filter((b) => b.status === "qc_hold").length} tone="warning" />
        <StatCard label="Đã lên lịch" value={PRODUCTION_BATCHES.filter((b) => b.status === "scheduled").length} />
      </div>

      <SimpleTable
        columns={[
          { key: "code", label: "Mã lô" },
          { key: "product", label: "Sản phẩm" },
          { key: "line", label: "Dây chuyền" },
          { key: "quantity", label: "Sản lượng", align: "right", render: (r) => r.quantity.toLocaleString("vi-VN") },
          { key: "mfg", label: "Ngày SX" },
          { key: "exp", label: "Hạn dùng" },
          {
            key: "status",
            label: "Trạng thái",
            render: (r) => <Pill tone={statusTone[r.status]}>{statusLabel[r.status]}</Pill>,
          },
        ]}
        rows={PRODUCTION_BATCHES}
      />
    </PageShell>
  );
}
