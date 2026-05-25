# Sữa Vina — Hệ thống nhãn điện tử (Demo)

Bộ demo **chạy hoàn toàn ở trình duyệt** — không backend, không database.
Deploy miễn phí lên GitHub Pages bằng workflow có sẵn.

```
elabel_2/
├── frontend/                 # App nội bộ B2B (Vite + React)
├── landing/                  # Trang nhãn B2C (Vite + React)
├── data/products.json        # Nguồn dữ liệu duy nhất — 30 sản phẩm Sữa Vina
├── scripts/sync-data.mjs     # Copy data/products.json → mỗi app/public/data/
├── docs/                     # site-index.html + ảnh chụp màn hình
└── .github/workflows/        # Auto-deploy GitHub Pages
```

## Chạy local

```bash
# 1. Sync dataset
node scripts/sync-data.mjs

# 2. Frontend (port 3000) — terminal 1
cd frontend && npm install && VITE_STATIC_MODE=true npm run dev

# 3. Landing (port 3002) — terminal 2
cd landing && npm install && VITE_STATIC_MODE=true npm run dev -- --port 3002
```

- **Frontend nội bộ**: <http://127.0.0.1:3000> · đăng nhập `admin / 123456`
- **Trang nhãn mẫu**: <http://127.0.0.1:3002/01/8938500000011?tax_code=0312345678>

## Deploy GitHub Pages

1. Push repo lên GitHub
2. **Settings → Pages → Source = "GitHub Actions"**
3. Mỗi `git push origin main` → workflow tự build + deploy

URLs sau khi deploy:
- `https://<you>.github.io/<repo>/` — trang index
- `https://<you>.github.io/<repo>/internal/` — app nội bộ (`admin / 123456`)
- `https://<you>.github.io/<repo>/landing/01/8938500000011?tax_code=0312345678` — trang nhãn

## Chỉnh sửa danh mục sản phẩm

`data/products.json` là nguồn duy nhất. Mỗi sản phẩm gồm:
- Thông tin cơ bản (`name`, `brand`, `gtin`, `description`...)
- Trạng thái (`draft` / `published` / `recalled`)
- Thuộc tính nhãn (`attributes` + `attributes_display`)
- Hình ảnh SVG inline data URI (`images`)
- Lô sản xuất (`batches`)
- Thông tin doanh nghiệp (`business`, `nbc_business`)

Sau khi sửa: `node scripts/sync-data.mjs && git commit -am '...' && git push`.

## Cách static mode hoạt động

- `VITE_STATIC_MODE=true` → frontend dùng **axios adapter giả**, không gọi backend
- Mọi `/api/*` được intercept và trả từ `products.json`
- Login: hardcoded `admin / 123456`
- Sync nhãn QG, cài đặt: lưu `localStorage` (chỉ trên trình duyệt đó)
- Tạo/sửa sản phẩm trong UI: trả success giả, không persist

## Tài khoản demo

| Username | Password | Vai trò |
|---|---|---|
| `admin` | `123456` | Quản trị viên Sữa Vina |
