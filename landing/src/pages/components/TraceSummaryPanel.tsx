import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import productLandingEn from '@/i18n/locales/productLanding.en.json'
import productLandingVi from '@/i18n/locales/productLanding.vi.json'
import type { Locale } from '@/models/product'
import { normalizeExternalUrl } from '@/pages/utils/batch-utils'

const landingCopy = {
  en: productLandingEn,
  vi: productLandingVi,
} as const

function TraceSummaryRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[114px_minmax(0,1fr)] gap-2.5 py-2.5 text-[1.02rem]">
      <span className="text-[#6f7891]">{label}</span>
      <span className="min-w-0 wrap-break-word font-medium text-[#2f3647]">{value}</span>
    </div>
  )
}

export function TraceSummaryPanel({
  batchLabel,
  batchNumber,
  detailActionLabel,
  detailUrl,
  expiryDate,
  expiryLabel,
  gtin,
  locale,
  manufactureDate,
  manufactureLabel,
  recalled,
}: {
  batchLabel: string
  batchNumber: string
  detailActionLabel: string
  detailUrl?: string
  expiryDate: string
  expiryLabel: string
  gtin: string
  locale: Locale
  manufactureDate: string
  manufactureLabel: string
  recalled?: boolean
}) {
  const ui = landingCopy[locale]
  const normalizedDetailUrl = normalizeExternalUrl(detailUrl);

  return (
    <div className="space-y-3.5">
      <p className="text-[0.95rem] leading-7 text-[#5f6d8f]">
        {ui.traceSummaryIntro}
      </p>

      <div className="divide-y divide-[#dfe5f1] bg-white">
        <TraceSummaryRow label="GTIN" value={gtin} />
        <TraceSummaryRow label={batchLabel} value={batchNumber} />
        <TraceSummaryRow label={manufactureLabel} value={manufactureDate} />
        <TraceSummaryRow label={expiryLabel} value={expiryDate} />
        <TraceSummaryRow
          label={ui.status}
          value={
            recalled ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#e3a2a2] bg-[#fff1f1] px-2 py-0.5 text-[0.86rem] font-semibold text-[#b53a3a]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#e05252]" />
                {ui.statusRecalled}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full border border-[#a7ebcf] bg-[#e6fbf1] px-2 py-0.5 text-[0.86rem] font-semibold text-[#128456]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#1ab779]" />
                {ui.statusPublishedAuthenticated}
              </span>
            )
          }
        />
      </div>
        {normalizedDetailUrl &&
          <button
            className={`cursor-pointer inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition ${
              normalizedDetailUrl
                ? 'bg-[#002C6B] text-white hover:bg-[#0a2d6d]'
                : 'bg-[#d0d0d0] text-[#808080] cursor-none'
            }`}
            onClick={() => window.open(normalizedDetailUrl || '', '_blank', 'noopener,noreferrer')}
            type="button"
            disabled={!normalizedDetailUrl}
          >
            <FileText size={15} />
            {detailActionLabel}
          </button> 
        }
    </div>
  )
}
