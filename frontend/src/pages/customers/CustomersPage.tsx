import { PageShell, Pill, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { CUSTOMERS } from "@/pages/_internal/fake-data";

export function CustomersPage() {
  return (
    <PageShell
      title="Khách hàng & Đại lý"
      subtitle="Hệ thống phân phối Modern Trade (MT) và General Trade (GT)."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng khách hàng" value={CUSTOMERS.length} />
        <StatCard label="MT - Siêu thị chuỗi" value={CUSTOMERS.filter((c) => c.type === "MT").length} tone="info" />
        <StatCard label="GT - Đại lý truyền thống" value={CUSTOMERS.filter((c) => c.type === "GT").length} />
      </div>

      <SimpleTable
        columns={[
          { key: "code", label: "Mã KH" },
          { key: "name", label: "Tên khách hàng" },
          {
            key: "type",
            label: "Kênh",
            render: (r) => <Pill tone={r.type === "MT" ? "info" : "neutral"}>{r.type}</Pill>,
          },
          { key: "contact", label: "Người liên hệ" },
          { key: "phone", label: "Điện thoại" },
          { key: "region", label: "Khu vực" },
          { key: "revenue", label: "Doanh thu YTD", align: "right" },
        ]}
        rows={CUSTOMERS}
      />
    </PageShell>
  );
}
