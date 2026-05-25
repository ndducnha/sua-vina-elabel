import { PageShell, SimpleTable, StatCard } from "@/pages/_internal/PageShell";
import { STAFF } from "@/pages/_internal/fake-data";

export function StaffPage() {
  return (
    <PageShell
      title="Nhân sự"
      subtitle="Danh bạ nhân viên Sữa Vina theo phòng ban."
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Tổng nhân viên" value={1248} />
        <StatCard label="Đang công tác" value={1212} tone="success" />
        <StatCard label="Tuyển dụng đang mở" value={14} tone="info" delta="Sản xuất, R&D, Bán hàng" />
      </div>

      <SimpleTable
        columns={[
          { key: "code", label: "Mã NV" },
          { key: "name", label: "Họ tên" },
          { key: "title", label: "Chức danh" },
          { key: "department", label: "Phòng ban" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Điện thoại" },
        ]}
        rows={STAFF}
      />
    </PageShell>
  );
}
