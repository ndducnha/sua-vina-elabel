// Fake data for the Sữa Vina internal demo. All values are made up.

export const INVENTORY = [
  { sku: "VINA-MILK-1L-001", name: "Sữa tươi nguyên kem 1L", warehouse: "Hà Nội", stock: 12450, unit: "hộp", reorder: 2000, status: "in_stock" },
  { sku: "VINA-MILK-180-002", name: "Sữa tươi tiệt trùng 180ml", warehouse: "Hà Nội", stock: 38200, unit: "hộp", reorder: 5000, status: "in_stock" },
  { sku: "VINA-YGT-100-003", name: "Sữa chua men sống 100g", warehouse: "Bình Dương", stock: 1820, unit: "hũ", reorder: 3000, status: "low" },
  { sku: "VINA-COND-380-004", name: "Sữa đặc có đường 380g", warehouse: "Đà Nẵng", stock: 7340, unit: "lon", reorder: 1500, status: "in_stock" },
  { sku: "VINA-FORM-400-005", name: "Sữa bột công thức trẻ em số 1", warehouse: "Bình Dương", stock: 540, unit: "hộp", reorder: 800, status: "low" },
  { sku: "VINA-FORM-900-006", name: "Sữa bột công thức số 2 - 900g", warehouse: "Bình Dương", stock: 2120, unit: "hộp", reorder: 1000, status: "in_stock" },
  { sku: "VINA-CHEESE-200-007", name: "Phô mai mozzarella 200g", warehouse: "Hà Nội", stock: 0, unit: "túi", reorder: 600, status: "out" },
  { sku: "VINA-BUTTER-180-008", name: "Bơ nhạt 180g", warehouse: "TP.HCM", stock: 980, unit: "thanh", reorder: 500, status: "in_stock" },
];

export const PRODUCTION_BATCHES = [
  { code: "LOT-2026-05-021", product: "Sữa tươi nguyên kem 1L", line: "Line A1", quantity: 12000, mfg: "21/05/2026", exp: "21/11/2026", status: "completed" },
  { code: "LOT-2026-05-022", product: "Sữa tươi tiệt trùng 180ml", line: "Line A2", quantity: 38000, mfg: "22/05/2026", exp: "22/10/2026", status: "completed" },
  { code: "LOT-2026-05-023", product: "Sữa chua men sống 100g", line: "Line B1", quantity: 24000, mfg: "23/05/2026", exp: "12/06/2026", status: "qc_hold" },
  { code: "LOT-2026-05-024", product: "Sữa đặc có đường 380g", line: "Line C1", quantity: 8500, mfg: "23/05/2026", exp: "23/05/2027", status: "running" },
  { code: "LOT-2026-05-025", product: "Sữa bột công thức số 2", line: "Line D1", quantity: 3200, mfg: "24/05/2026", exp: "24/05/2028", status: "running" },
  { code: "LOT-2026-05-026", product: "Phô mai mozzarella", line: "Line E1", quantity: 1500, mfg: "24/05/2026", exp: "24/07/2026", status: "scheduled" },
];

export const ORDERS = [
  { code: "SO-2026-04812", customer: "Co.opmart TP.HCM", channel: "MT", items: 14, total: "486.250.000 ₫", status: "shipped", placed: "23/05" },
  { code: "SO-2026-04813", customer: "Đại lý Minh Anh - Cần Thơ", channel: "GT", items: 8, total: "92.180.000 ₫", status: "packing", placed: "23/05" },
  { code: "SO-2026-04814", customer: "BigC Thăng Long", channel: "MT", items: 22, total: "1.182.000.000 ₫", status: "confirmed", placed: "24/05" },
  { code: "SO-2026-04815", customer: "Đại lý Hồng Phát - Đà Nẵng", channel: "GT", items: 5, total: "48.500.000 ₫", status: "draft", placed: "24/05" },
  { code: "SO-2026-04816", customer: "WinMart Hà Nội", channel: "MT", items: 30, total: "1.642.000.000 ₫", status: "shipped", placed: "24/05" },
  { code: "SO-2026-04817", customer: "Lotte Mart Quận 7", channel: "MT", items: 18, total: "892.400.000 ₫", status: "confirmed", placed: "25/05" },
];

export const CUSTOMERS = [
  { code: "KH-00001", name: "Saigon Co.op", type: "MT", contact: "Nguyễn Thị Lan", phone: "0903 111 222", region: "Miền Nam", revenue: "12.4 tỷ" },
  { code: "KH-00002", name: "Central Retail Việt Nam", type: "MT", contact: "Trần Văn Khoa", phone: "0908 444 555", region: "Toàn quốc", revenue: "18.7 tỷ" },
  { code: "KH-00003", name: "Đại lý Minh Anh", type: "GT", contact: "Lê Thị Hà", phone: "0912 333 444", region: "Cần Thơ", revenue: "1.2 tỷ" },
  { code: "KH-00004", name: "WinCommerce", type: "MT", contact: "Phạm Quang Huy", phone: "0915 666 777", region: "Toàn quốc", revenue: "9.8 tỷ" },
  { code: "KH-00005", name: "Đại lý Hồng Phát", type: "GT", contact: "Hoàng Văn Nam", phone: "0934 888 999", region: "Đà Nẵng", revenue: "780 triệu" },
  { code: "KH-00006", name: "Aeon Mall Việt Nam", type: "MT", contact: "Yamamoto Aki", phone: "0901 222 333", region: "Miền Bắc & Nam", revenue: "6.5 tỷ" },
];

export const SUPPLIERS = [
  { code: "NCC-001", name: "HTX Bò sữa Mộc Châu", item: "Sữa tươi nguyên liệu", lead: "1 ngày", quality: "A", contract: "Đến 12/2026" },
  { code: "NCC-002", name: "HTX Bò sữa Ba Vì", item: "Sữa tươi nguyên liệu", lead: "1 ngày", quality: "A", contract: "Đến 06/2027" },
  { code: "NCC-003", name: "Tetra Pak Việt Nam", item: "Bao bì giấy 1L", lead: "5 ngày", quality: "A", contract: "Đến 03/2027" },
  { code: "NCC-004", name: "Nutricia (NL)", item: "Whey protein, vitamin premix", lead: "30 ngày", quality: "A", contract: "Đến 09/2026" },
  { code: "NCC-005", name: "Công ty SX Bao bì Đồng Tâm", item: "Lon 380g", lead: "7 ngày", quality: "B+", contract: "Đến 10/2026" },
];

export const STAFF = [
  { code: "NV-001", name: "Nguyễn Văn An", title: "Giám đốc Sản xuất", department: "Sản xuất", email: "an.nguyen@suavina.local", phone: "0901 234 567" },
  { code: "NV-002", name: "Trần Thị Bình", title: "Trưởng phòng QA/QC", department: "Chất lượng", email: "binh.tran@suavina.local", phone: "0902 345 678" },
  { code: "NV-003", name: "Lê Quốc Cường", title: "Trưởng phòng Bán hàng MT", department: "Kinh doanh", email: "cuong.le@suavina.local", phone: "0903 456 789" },
  { code: "NV-004", name: "Phạm Thị Dung", title: "Kế toán trưởng", department: "Tài chính", email: "dung.pham@suavina.local", phone: "0904 567 890" },
  { code: "NV-005", name: "Hoàng Văn Em", title: "Trưởng kho Bình Dương", department: "Logistics", email: "em.hoang@suavina.local", phone: "0905 678 901" },
  { code: "NV-006", name: "Vũ Thị Giang", title: "Chuyên viên R&D", department: "Nghiên cứu", email: "giang.vu@suavina.local", phone: "0906 789 012" },
];

export const REPORT_CARDS = [
  { label: "Doanh thu tháng 5/2026", value: "47.8 tỷ ₫", delta: "+12.4% so với tháng trước", tone: "success" as const },
  { label: "Sản lượng sản xuất (lít)", value: "1.24M", delta: "+8.1%", tone: "info" as const },
  { label: "Tỷ lệ phế phẩm QA/QC", value: "0.42%", delta: "-0.06pp", tone: "success" as const },
  { label: "Đơn hàng chờ giao", value: "27", delta: "Cần xử lý trong 24h", tone: "warning" as const },
];

export const REPORT_TOP_PRODUCTS = [
  { rank: 1, product: "Sữa tươi tiệt trùng 180ml", revenue: "14.2 tỷ ₫", share: "29.7%" },
  { rank: 2, product: "Sữa chua men sống 100g", revenue: "8.6 tỷ ₫", share: "18.0%" },
  { rank: 3, product: "Sữa tươi nguyên kem 1L", revenue: "7.9 tỷ ₫", share: "16.5%" },
  { rank: 4, product: "Sữa đặc có đường 380g", revenue: "5.1 tỷ ₫", share: "10.7%" },
  { rank: 5, product: "Sữa bột công thức số 2", revenue: "4.4 tỷ ₫", share: "9.2%" },
];
