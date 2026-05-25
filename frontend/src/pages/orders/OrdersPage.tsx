import { PageShell, Pill, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { ORDERS } from "@/pages/_internal/fake-data";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const statusTone: Record<string, "success" | "info" | "warning" | "neutral"> = {
  shipped: "success",
  packing: "info",
  confirmed: "info",
  draft: "neutral",
};
const statusLabel: Record<string, string> = {
  shipped: "Đã giao",
  packing: "Đang đóng gói",
  confirmed: "Đã xác nhận",
  draft: "Bản nháp",
};

export function OrdersPage() {
  return (
    <PageShell
      title="Đơn hàng"
      subtitle="Đơn đặt hàng từ Modern Trade (MT) và General Trade (GT)."
      actions={
        <Button className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> Tạo đơn hàng
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatCard label="Đơn hôm nay" value={ORDERS.filter((o) => o.placed === "25/05").length} tone="info" />
        <StatCard label="Đang đóng gói" value={ORDERS.filter((o) => o.status === "packing").length} tone="warning" />
        <StatCard label="Đã giao tuần này" value={ORDERS.filter((o) => o.status === "shipped").length} tone="success" />
        <StatCard label="Tổng giá trị đơn (mở)" value="4.3 tỷ ₫" />
      </div>

      <SimpleTable
        columns={[
          { key: "code", label: "Mã đơn" },
          { key: "customer", label: "Khách hàng" },
          {
            key: "channel",
            label: "Kênh",
            render: (r) => <Pill tone={r.channel === "MT" ? "info" : "neutral"}>{r.channel}</Pill>,
          },
          { key: "items", label: "SP", align: "right" },
          { key: "total", label: "Giá trị", align: "right" },
          { key: "placed", label: "Ngày đặt" },
          {
            key: "status",
            label: "Trạng thái",
            render: (r) => <Pill tone={statusTone[r.status]}>{statusLabel[r.status]}</Pill>,
          },
        ]}
        rows={ORDERS}
      />
    </PageShell>
  );
}
