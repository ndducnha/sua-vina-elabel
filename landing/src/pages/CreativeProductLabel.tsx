import { useState } from 'react'
import { usePublicProduct } from '../hooks/usePublicProduct'

/**
 * Sữa Vina e-label — fresh dairy aesthetic.
 * Palette: pure white + sky/cyan/dairy blue + soft mint accents.
 * Decorative: milk-droplet motifs, poured-milk waves, dairy farm rhythm.
 */
export function CreativeProductLabel() {
  const { resolved, isResolving } = usePublicProduct()
  const product = resolved?.product
  const lot = resolved?.lot
  const fields = product?.fields ?? []
  const customFields = product?.customFields ?? []
  const images = product?.mediaLinks ?? []
  const owner = product?.gs1CodeOwner
  const isRecalled = product?.productRecall?.recalled

  const heroImage = images[0]?.url
  const storyImage = images[1]?.url ?? images[0]?.url
  const galleryImages = images.slice(0, 4)

  const f01 = fields.find((f) => f.fieldCode === 'F01')
  const f07 = fields.find((f) => f.fieldCode === 'F07')
  const f08 = fields.find((f) => f.fieldCode === 'F08')
  const f09 = fields.find((f) => f.fieldCode === 'F09')
  const f10 = fields.find((f) => f.fieldCode === 'F10')
  const f11 = fields.find((f) => f.fieldCode === 'F11')

  const brand = product?.brand?.trim()
  const productName = product?.productName?.vi ?? ''
  const meta = product as unknown as Record<string, unknown> | undefined
  const taxCode = meta?.tax_code as string | undefined
  const targetMarket = meta?.target_market as string | undefined
  const countryOfOrigin = meta?.country_of_origin as string | undefined
  const supplier = meta?.supplier as string | undefined
  const categoryName = product?.category?.nameVi ?? ''

  const certBadges = customFields.filter((f) =>
    /halal|vegan|nutri|gluten|export|iso|haccp|organic/i.test(f.label + ' ' + f.fieldCode),
  )

  if (isResolving || !resolved) return <LoaderScreen />
  if (resolved.status === 'not-found' || !product) return <NotFoundScreen />

  return (
    <div
      className="min-h-screen bg-[#eaf3ff]"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
    >
      <div className="mx-auto max-w-[420px] bg-white text-slate-800 shadow-[0_30px_60px_-20px_rgba(30,60,100,0.25)]">

        {/* ====== TOP BAR ====== */}
        <header className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md">
              <MilkDrop className="h-5 w-5 text-white" />
            </div>
            <span
              className="text-sm font-bold tracking-wide text-[#1e3a5c]"
              style={{ fontFamily: '"Playfair Display", serif' }}
            >
              Sữa Vina
            </span>
          </div>
          <LangSwitch />
        </header>

        <div className="px-5 pb-3">
          {taxCode && product.identifiers?.gtin ? (
            <a
              href={`https://qr.gov.vn/${encodeURIComponent(taxCode)}/${encodeURIComponent(product.identifiers.gtin)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center justify-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] tracking-[0.2em] text-blue-700 transition hover:bg-blue-100 hover:shadow-sm"
              title="Xác minh trên cổng qr.gov.vn"
            >
              <SealIcon className="h-3 w-3" />
              <span>ĐÃ XÁC THỰC · NHÃN ĐIỆN TỬ QUỐC GIA</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="opacity-60 group-hover:opacity-100">
                <path d="M14 5h5v5M19 5l-9 9M5 12v7h7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[10px] tracking-[0.2em] text-blue-700">
              <SealIcon className="h-3 w-3" />
              ĐÃ XÁC THỰC · NHÃN ĐIỆN TỬ QUỐC GIA
            </div>
          )}
        </div>

        {/* ====== HERO ====== */}
        <section className="relative overflow-hidden">
          {heroImage ? (
            <div className="relative h-[400px] w-full">
              <img src={heroImage} alt={productName} className="absolute inset-0 h-full w-full object-cover" />
              {/* Cream wash + drip from bottom (like pouring milk over photo) */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-white" />
              <PouredMilk className="absolute -bottom-1 left-0 w-full text-white" />
              {/* Floating milk droplets */}
              <FloatingDrops className="absolute right-4 top-6 text-white/70" />
              {isRecalled && (
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-red-600/90 px-4 py-3 text-center backdrop-blur">
                  <p className="text-2xl">⚠️</p>
                  <p className="mt-1 text-sm font-bold text-white">Sản phẩm đã thu hồi</p>
                  {product.productRecall?.reasonVi && (
                    <p className="mt-1 text-xs text-red-50">{product.productRecall.reasonVi}</p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex h-[260px] items-center justify-center bg-gradient-to-b from-blue-100 to-white">
              <span className="text-8xl">🥛</span>
              <PouredMilk className="absolute -bottom-1 left-0 w-full text-white" />
            </div>
          )}
        </section>

        {/* ====== TITLE CARD ====== */}
        <section className="relative -mt-12 px-5">
          <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-white px-5 pt-6 pb-5 text-center shadow-xl">
            {/* Decorative milk drops in corners */}
            <MilkDrop className="absolute -left-3 -top-3 h-12 w-12 rotate-12 text-blue-100" />
            <MilkDrop className="absolute -right-3 -bottom-3 h-10 w-10 -rotate-12 text-cyan-100" />

            <p className="text-[9px] uppercase tracking-[0.3em] text-blue-600/80">
              {(owner?.name ?? 'Công ty Cổ phần Sữa Vina').toUpperCase()}
            </p>
            <h1
              className="mt-2 leading-tight text-[#1e3a5c]"
              style={{
                fontFamily: '"Playfair Display", serif',
                fontSize: '24px',
                fontStyle: 'italic',
                fontWeight: 600,
              }}
            >
              {productName}
            </h1>

            {/* Divider with milk drop */}
            <div className="my-4 flex items-center justify-center gap-2">
              <span className="h-px w-12 bg-blue-200" />
              <MilkDrop className="h-3 w-3 text-blue-400" />
              <span className="h-px w-12 bg-blue-200" />
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-slate-600">
              {f01 && <Fact icon={<DropIcon className="h-3.5 w-3.5 text-blue-500" />} value={f01.value} />}
              {lot?.manufactureDate && (
                <Fact icon={<span className="text-sm">📅</span>} label="NSX" value={lot.manufactureDate} />
              )}
              {lot?.expiryDate && lot.expiryDate !== '-' && (
                <Fact icon={<span className="text-sm">⏳</span>} label="HSD" value={lot.expiryDate} />
              )}
            </div>

            {product?.description && (
              <p className="mt-3 text-xs leading-relaxed text-slate-500">{product.description}</p>
            )}
          </div>
        </section>

        {/* ====== CHIPS ====== */}
        <section className="px-5 pt-5">
          <div className="flex flex-wrap justify-center gap-2">
            {categoryName && (
              <Chip variant="blue" icon="🥛">
                {categoryName.length > 22 ? categoryName.slice(0, 22) + '…' : categoryName}
              </Chip>
            )}
            {countryOfOrigin && <Chip variant="sky" icon="📍">{countryOfOrigin}</Chip>}
            {targetMarket && <Chip variant="sky" icon="🌏">{targetMarket}</Chip>}
            {certBadges.slice(0, 3).map((c) => (
              <Chip key={c.fieldCode} variant="cyan" icon="🏅">
                {c.label.length > 22 ? c.label.slice(0, 22) + '…' : c.label}
              </Chip>
            ))}
          </div>
        </section>

        {/* ====== POETIC STORY BAND ====== */}
        {storyImage && (
          <section className="mt-6 px-5">
            <div className="relative h-44 overflow-hidden rounded-3xl shadow-md">
              <img src={storyImage} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-900/85 via-blue-900/35 to-transparent" />
              {/* Floating drops on overlay */}
              <FloatingDrops className="absolute right-3 top-3 text-white/60" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-center text-white">
                <p
                  className="text-white drop-shadow-md"
                  style={{ fontFamily: '"Dancing Script", cursive', fontSize: '28px', fontWeight: 600 }}
                >
                  Từ đồng cỏ Mộc Châu
                </p>
                <p
                  className="text-cyan-100 drop-shadow-md"
                  style={{ fontFamily: '"Dancing Script", cursive', fontSize: '22px', fontWeight: 600 }}
                >
                  đến giọt sữa tinh khôi
                </p>
              </div>
            </div>
          </section>
        )}

        {/* ====== STAT BANNER ====== */}
        <section className="mt-5 px-5">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 p-4 text-white shadow-md">
            <StatTile big="100%" small="Sữa tươi nguyên chất" />
            <StatTile big="0" small="Chất bảo quản" />
            <StatTile big="ISO" small="22000:2018" />
          </div>
        </section>

        {/* ====== GALLERY ====== */}
        {galleryImages.length > 1 && (
          <section className="mt-5 px-5">
            <div className="grid grid-cols-2 gap-3">
              {galleryImages.slice(0, 2).map((img, i) => (
                <div
                  key={i}
                  className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm"
                >
                  <img src={img.url} alt={img.title} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ====== ACCORDION SECTIONS ====== */}
        <section className="mt-5 space-y-3 px-5 pb-10">
          <Accordion title="Nguồn gốc & Thông tin lô hàng" icon="🐄" defaultOpen>
            <DetailRow label="Nhà cung cấp" value={supplier ?? owner?.name ?? '—'} />
            <DetailRow label="Nhãn hiệu" value={brand ?? '—'} />
            <DetailRow label="Mã định danh (GTIN)" value={product.identifiers?.gtin ?? '—'} mono />
            {lot?.serial && <DetailRow label="Số lô" value={lot.serial} mono />}
            {lot?.manufactureDate && <DetailRow label="Ngày sản xuất" value={lot.manufactureDate} />}
            {lot?.expiryDate && lot.expiryDate !== '-' && (
              <DetailRow label="Hạn sử dụng" value={lot.expiryDate} accent="blue" />
            )}
            {lot?.totalQuantity != null && (
              <DetailRow label="Số lượng lô" value={`${lot.totalQuantity.toLocaleString('vi-VN')} đơn vị`} />
            )}
            {taxCode && <DetailRow label="Mã số thuế" value={taxCode} mono />}
          </Accordion>

          {(f07 || f08) && (
            <Accordion title="Thành phần & Giá trị dinh dưỡng" icon="🥛">
              {f07 && <ParagraphRow label="Thành phần" value={f07.value} />}
              {f08 && <NutritionBlock raw={f08.value} />}
            </Accordion>
          )}

          {(f09 || f10 || f11) && (
            <Accordion title="Hướng dẫn sử dụng & Cảnh báo" icon="📖">
              {f11 && <ParagraphRow label="Bảo quản" value={f11.value} accent="blue" />}
              {f10 && <ParagraphRow label="Hướng dẫn sử dụng" value={f10.value} />}
              {f09 && <ParagraphRow label="Cảnh báo" value={f09.value} accent="red" />}
            </Accordion>
          )}

          {customFields.length > 0 && (
            <Accordion title="Chứng nhận & Kiểm định" icon="🏅">
              {customFields.map((c) => (
                <DetailRow key={c.fieldCode} label={c.label} value={c.value} />
              ))}
              <DetailRow label="Hệ thống quản lý chất lượng" value="ISO 22000:2018 · HACCP" />
              <DetailRow label="Đơn vị công bố" value={owner?.name ?? 'Công ty Cổ phần Sữa Vina'} />
            </Accordion>
          )}

          {fields.filter((f) => !['F01', 'F07', 'F08', 'F09', 'F10', 'F11'].includes(f.fieldCode)).length > 0 && (
            <Accordion title="Thông tin bổ sung khác" icon="ℹ️">
              {fields
                .filter((f) => !['F01', 'F07', 'F08', 'F09', 'F10', 'F11'].includes(f.fieldCode))
                .map((f) => (
                  <ParagraphRow key={f.fieldCode} label={f.label} value={f.value} />
                ))}
            </Accordion>
          )}

          <Accordion title="Liên hệ nhà sản xuất" icon="🏭">
            <DetailRow label="Doanh nghiệp" value={owner?.name ?? 'Công ty Cổ phần Sữa Vina'} />
            {owner?.address && <DetailRow label="Địa chỉ" value={owner.address} />}
            {owner?.phone && <DetailRow label="Điện thoại" value={owner.phone} />}
            {owner?.email && <DetailRow label="Email" value={owner.email} />}
            <DetailRow label="Hotline tư vấn" value="1900 0000 (8h–20h)" />
          </Accordion>
        </section>

        {/* ====== FOOTER ====== */}
        <footer className="relative overflow-hidden border-t border-blue-100 bg-gradient-to-b from-white to-blue-50 px-5 py-6 text-center">
          <PouredMilk className="absolute -top-2 left-0 w-full rotate-180 text-white" />
          <div className="relative">
            <div className="flex items-center justify-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow">
                <MilkDrop className="h-4 w-4 text-white" />
              </div>
              <p
                className="text-blue-700"
                style={{ fontFamily: '"Dancing Script", cursive', fontSize: '20px', fontWeight: 600 }}
              >
                Sữa Vina
              </p>
            </div>
            <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-blue-600/60">
              © {new Date().getFullYear()} · Cổng truy xuất Sữa Vina
            </p>
            <p
              className="mt-2 text-blue-500/70"
              style={{ fontFamily: '"Dancing Script", cursive', fontSize: '14px' }}
            >
              Tinh khôi từ đồng cỏ Việt Nam
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}

// ============================================================================
// Sub-components
// ============================================================================

function Fact({ icon, label, value }: { icon: React.ReactNode; label?: string; value: string }) {
  return (
    <span className="flex items-center gap-1.5">
      {icon}
      {label && <span className="text-slate-400">{label}</span>}
      <span className="font-semibold text-slate-700">{value}</span>
    </span>
  )
}

function Chip({
  icon,
  variant,
  children,
}: {
  icon: string
  variant: 'blue' | 'sky' | 'cyan'
  children: React.ReactNode
}) {
  const cls = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    sky: 'border-sky-200 bg-sky-50 text-sky-700',
    cyan: 'border-cyan-300/60 bg-gradient-to-br from-cyan-50 to-blue-50 text-cyan-700',
  }[variant]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium ${cls}`}>
      <span>{icon}</span>
      <span>{children}</span>
    </span>
  )
}

function StatTile({ big, small }: { big: string; small: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold leading-tight">{big}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-white/85">{small}</p>
    </div>
  )
}

function Accordion({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string
  icon?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2.5">
          {icon && (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-50 text-base">
              {icon}
            </span>
          )}
          <span className="text-sm font-semibold text-[#1e3a5c]">{title}</span>
        </span>
        <span className={`transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" className="text-blue-500" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="border-t border-blue-100/70 px-4 py-3 bg-gradient-to-b from-blue-50/30 to-transparent">
          <dl className="divide-y divide-blue-100/60">{children}</dl>
        </div>
      )}
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono = false,
  accent = 'default',
}: {
  label: string
  value: string
  mono?: boolean
  accent?: 'default' | 'blue'
}) {
  const valueColor = accent === 'blue' ? 'text-blue-700 font-semibold' : 'text-slate-800'
  return (
    <div className="grid grid-cols-5 gap-3 py-2.5 text-xs">
      <dt className="col-span-2 text-slate-500">{label}</dt>
      <dd className={`col-span-3 text-right ${valueColor} ${mono ? 'font-mono tabular-nums' : ''}`}>{value}</dd>
    </div>
  )
}

function ParagraphRow({
  label,
  value,
  accent = 'default',
}: {
  label: string
  value: string
  accent?: 'default' | 'blue' | 'red'
}) {
  const accentText = {
    default: 'text-slate-700',
    blue: 'text-blue-700',
    red: 'text-red-700',
  }[accent]
  const bg = {
    default: '',
    blue: 'rounded-xl bg-blue-50/60 px-3 py-2 border border-blue-100',
    red: 'rounded-xl bg-red-50/60 px-3 py-2 border border-red-100',
  }[accent]
  return (
    <div className="py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-xs leading-relaxed ${accentText} ${bg}`}>{value}</p>
    </div>
  )
}

function NutritionBlock({ raw }: { raw: string }) {
  const rows = raw.split(/[·•|]/).map((s) => s.trim()).filter(Boolean)
  if (rows.length < 2) return <ParagraphRow label="Giá trị dinh dưỡng" value={raw} />
  return (
    <div className="py-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">Giá trị dinh dưỡng</p>
      <div className="mt-2 overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-br from-blue-50/60 to-white">
        <div className="bg-blue-600 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white">
          Giá trị dinh dưỡng · Trên 100ml
        </div>
        <div className="grid grid-cols-2 gap-x-3 px-3 py-2 text-[11px]">
          {rows.map((r, i) => {
            const parts = r.split(/\s+/)
            const label = parts.slice(0, -2).join(' ') || parts[0]
            const num = parts.slice(-2).join(' ')
            return (
              <div key={i} className="flex items-baseline justify-between gap-2 border-b border-blue-100/60 py-1.5 last:border-b-0">
                <span className="truncate text-slate-600">{label}</span>
                <span className="font-bold text-[#1e3a5c]">{num}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function LangSwitch() {
  return (
    <button
      className="rounded-full border border-blue-200/60 bg-white/80 p-2 text-blue-700 shadow-sm hover:bg-blue-50"
      aria-label="Đổi ngôn ngữ"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 12h18M12 3a13 13 0 010 18M12 3a13 13 0 000 18" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </button>
  )
}

function SealIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** Stylised milk droplet shape (tear-drop). */
function MilkDrop({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 32" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0 C8 8, 2 14, 2 21 C2 27, 7 32, 12 32 C17 32, 22 27, 22 21 C22 14, 16 8, 12 0 Z" />
    </svg>
  )
}

function DropIcon({ className }: { className?: string }) {
  return <MilkDrop className={className} />
}

/** Wavy "poured milk" SVG to layer at hero/footer edges. */
function PouredMilk({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 420 40" preserveAspectRatio="none" className={className}>
      <path
        d="M0 25 C 60 5, 120 35, 180 22 C 240 10, 300 32, 360 20 C 390 14, 410 24, 420 20 L 420 40 L 0 40 Z"
        fill="currentColor"
      />
    </svg>
  )
}

/** Three floating milk droplets at varying sizes. */
function FloatingDrops({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 60" fill="currentColor" className={className}>
      <ellipse cx="12" cy="14" rx="4" ry="6" />
      <ellipse cx="35" cy="28" rx="6" ry="9" />
      <ellipse cx="22" cy="46" rx="3" ry="4.5" />
    </svg>
  )
}

function LoaderScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eaf3ff]">
      <div className="text-center">
        <div className="relative mx-auto h-16 w-12">
          <MilkDrop className="absolute inset-0 h-full w-full animate-pulse text-blue-400" />
        </div>
        <p
          className="mt-4 text-blue-700"
          style={{ fontFamily: '"Dancing Script", cursive', fontSize: '22px' }}
        >
          Đang truy xuất nhãn sản phẩm…
        </p>
      </div>
    </div>
  )
}

function NotFoundScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eaf3ff] p-6">
      <div className="mx-auto max-w-sm rounded-3xl border border-blue-100 bg-white p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <MilkDrop className="h-10 w-10 text-blue-300" />
        </div>
        <h1
          className="mt-4 text-xl text-[#1e3a5c]"
          style={{ fontFamily: '"Playfair Display", serif', fontStyle: 'italic' }}
        >
          Không tìm thấy nhãn
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Mã QR có thể không hợp lệ hoặc sản phẩm chưa được đăng ký với Sữa Vina.
        </p>
      </div>
    </div>
  )
}
