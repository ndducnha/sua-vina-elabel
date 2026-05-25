import { PageShell, Pill, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { INVENTORY } from "@/pages/_internal/fake-data";

export function InventoryPage() {
  const totalStock = INVENTORY.reduce((s, r) => s + r.stock, 0);
  const lowCount = INVENTORY.filter((r) => r.status === "low" || r.status === "out").length;
  const skuCount = INVENTORY.length;

  return (
    <PageShell
      title="Kho hàng"
      subtitle="Tồn kho theo SKU tại các kho miền Bắc — Trung — Nam."
      actions={
        <Button className="bg-primary text-white hover:bg-primary/90">
          <Plus className="mr-1.5 h-4 w-4" /> Nhập kho
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng SKU đang theo dõi" value={skuCount} />
        <StatCard label="Tồn kho tổng (đơn vị)" value={totalStock.toLocaleString("vi-VN")} tone="info" />
        <StatCard label="Cảnh báo dưới mức tối thiểu" value={lowCount} tone="warning" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input placeholder="Tìm theo SKU hoặc tên sản phẩm..." className="h-10 w-72 border-slate-300" />
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option>Tất cả kho</option>
          <option>Hà Nội</option>
          <option>Đà Nẵng</option>
          <option>Bình Dương</option>
          <option>TP.HCM</option>
        </select>
        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm">
          <option>Tất cả trạng thái</option>
          <option>Còn hàng</option>
          <option>Sắp hết</option>
          <option>Hết hàng</option>
        </select>
      </div>

      <SimpleTable
        columns={[
          { key: "sku", label: "SKU" },
          { key: "name", label: "Tên sản phẩm" },
          { key: "warehouse", label: "Kho" },
          { key: "stock", label: "Tồn kho", align: "right", render: (r) => r.stock.toLocaleString("vi-VN") },
          { key: "unit", label: "Đơn vị" },
          { key: "reorder", label: "Tồn tối thiểu", align: "right", render: (r) => r.reorder.toLocaleString("vi-VN") },
          {
            key: "status",
            label: "Trạng thái",
            render: (r) => {
              if (r.status === "out") return <Pill tone="danger">Hết hàng</Pill>;
              if (r.status === "low") return <Pill tone="warning">Sắp hết</Pill>;
              return <Pill tone="success">Còn hàng</Pill>;
            },
          },
        ]}
        rows={INVENTORY}
      />
    </PageShell>
  );
}
