import { AlertTriangle, Search, Calendar } from 'lucide-react'
import type { ProductLot } from '@/models/batch'
import type { Locale } from '@/models/product'
import { formatLotSerialDisplay } from '@/lib/lotSerialDisplay'

export type LotLookupPanelVariant = 'sheet' | 'trace'

export type LotLookupStrings = {
  availableLotsTitle: string
  lookup: string
  lookupByDate: string
  lookupBySerial: string
  lookupLoading: string
  lookupPlaceholder: string
  lotSerialHeader: string
  lotsUnit: string
  mfgDateShortHeader: string
  serialInvalidFormat: string
  status: string
  statusActive: string
  statusRecalled: string
  traceSubtitle: string
  cancelLookupAction?: string
  lookupAnother?: string
}

type TraceModeForLookup = 'list' | 'lookup'

type LotLookupPanelProps = {
  canLookup: boolean
  formatLotDate: (raw: string, loc: Locale) => string
  isLotSpecificScan: boolean
  locale: Locale
  lookupDate: string
  lookupError: string | null
  lookupLoading: boolean
  lookupSerial: string
  onClearLookupError: () => void
  onLookupDateChange: (value: string) => void
  onLookupSerialChange: (value: string) => void
  onRunLookup: () => void
  onSelectCandidate: (lot: ProductLot) => void
  productRecall: { recalled: boolean }
  serialValidationError: string | null
  strings: LotLookupStrings
  traceCandidates: ProductLot[]
  traceMode: TraceModeForLookup
  variant: LotLookupPanelVariant
  formContainerId?: string
  formatSerialDisplay?: (serial: string) => string
  onCancelLookup?: () => void
  showCancelLookup?: boolean
}

export function LotLookupPanel({
  canLookup,
  formatLotDate,
  formatSerialDisplay = formatLotSerialDisplay,
  formContainerId,
  isLotSpecificScan,
  locale,
  lookupDate,
  lookupError,
  lookupLoading,
  lookupSerial,
  onClearLookupError,
  onLookupDateChange,
  onLookupSerialChange,
  onRunLookup,
  onSelectCandidate,
  productRecall,
  serialValidationError,
  strings,
  traceCandidates,
  traceMode,
  variant,
  onCancelLookup,
}: LotLookupPanelProps) {
  const showAvailableList = traceMode === 'list' && traceCandidates.length > 0

  // Handle iOS Safari auto-zoom out on blur for small text inputs
  const handleInputBlur = () => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    if (!isIOS) return

    const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement
    if (viewport) {
      const originalContent = viewport.content
      // Force zoom out by temporarily applying maximum-scale=1
      viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1'
      setTimeout(() => {
        // Restore original viewport
        viewport.content = originalContent
      }, 300)
    }
  }

  // Show form only when there's no active list result
  const showFormPanel =
    !showAvailableList &&
    (traceMode === 'lookup' || traceMode === 'list') &&
    (variant === 'sheet' ? true : !isLotSpecificScan)

  return (
    <>
      {showFormPanel ? (
        <div id={formContainerId}>
          <p className="mb-4 text-sm text-[#606a85]">{strings.traceSubtitle}</p>
          <div className="space-y-3">
            {lookupError ? (
              <div className="flex items-start gap-2 rounded-xl bg-[#ffebee] px-3.5 py-3">
                <AlertTriangle className="h-[18px] w-[18px] shrink-0 text-[#d32f2f]" />
                <p className="text-sm font-medium text-[#d32f2f]">{lookupError}</p>
              </div>
            ) : null}

            <label className="block relative">
              <span className="mb-1 block text-sm font-medium text-[#202844]">{strings.lookupByDate}</span>
              <div className="relative w-full rounded-xl border border-[#dbe1f0] bg-white px-3 py-2 text-sm focus-within:ring focus-within:ring-[#2f4fbc]">
                {/* Visible display layer */}
                <div className="flex h-5 items-center justify-between pointer-events-none">
                  <span className={lookupDate ? 'text-[#202844]' : 'text-[#8a96b3]'}>
                    {lookupDate ? lookupDate.split('-').reverse().join('/') : 'dd/mm/yyyy'}
                  </span>
                  <Calendar className="h-5 w-5 text-[#8a96b3]" />
                </div>

                {/* Invisible native picker layer */}
                <input
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
                  lang={locale === 'en' ? 'en-GB' : 'vi-VN'}
                  onChange={(event) => {
                    onLookupDateChange(event.target.value)
                    onClearLookupError()
                  }}
                  onClick={(e) => {
                    try {
                      if (typeof e.currentTarget.showPicker === 'function') {
                        e.currentTarget.showPicker()
                      }
                    } catch (error) {
                      // Ignore error if showPicker is not supported or fails
                    }
                  }}
                  type="date"
                  value={lookupDate}
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-[#202844]">{strings.lookupBySerial}</span>
              <input
                className={`w-full rounded-xl border px-3 py-2 text-sm outline-none ring-[#2f4fbc] focus:ring ${serialValidationError ? 'border-[#bf360c]' : 'border-[#dbe1f0]'
                  }`}
                onChange={(event) => {
                  onLookupSerialChange(event.target.value)
                  onClearLookupError()
                }}
                onBlur={handleInputBlur}
                placeholder={strings.lookupPlaceholder}
                type="text"
                value={lookupSerial}
              />
              {serialValidationError ? (
                <p className="mt-1 text-sm text-[#bf360c]">{serialValidationError}</p>
              ) : null}
            </label>

            <button
              className="inline-flex w-full items-center justify-center gap-2 bg-[#002C6B] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 rounded-md hover:opacity-90 cursor-pointer"
              disabled={!canLookup || lookupLoading || Boolean(serialValidationError)}
              onClick={onRunLookup}
              type="button"
            >
              <Search size={16} />
              {lookupLoading ? strings.lookupLoading : strings.lookup}
            </button>
          </div>
        </div>
      ) : null}

      {showAvailableList ? (
        <>
          {onCancelLookup && strings.lookupAnother ? (
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-[#c9d6f8] bg-[#f5f8ff] px-4 py-2 text-sm font-semibold text-[#2340aa] transition hover:bg-[#eaf1ff] cursor-pointer mb-4"
              onClick={onCancelLookup}
              type="button"
            >
              <Search size={16} />
              {strings.lookupAnother}
            </button>
          ) : null}
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between px-1">
              <p className="text-[0.95rem] font-bold text-[#183a8f]">{strings.availableLotsTitle}</p>
              <span className="rounded-full border border-[#b9cdf8] bg-[#eaf1ff] px-2.5 py-0.5 text-[0.75rem] font-semibold text-[#3858b6]">
                {traceCandidates.length} {strings.lotsUnit}
              </span>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#dbe1f0] bg-white shadow-[0_8px_20px_rgba(30,60,120,0.06)]">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse bg-white">
                  <thead className="bg-[#f8faff]">
                    <tr className="border-b border-[#e9edf5] text-[0.78rem] font-semibold uppercase tracking-[0.02em] text-[#5f6c8b]">
                      <th className="w-[35%] px-4 py-2.5 text-left">{strings.lotSerialHeader}</th>
                      <th className="w-[25%] xs:w-[20%] px-2 py-2.5 text-left">{strings.mfgDateShortHeader}</th>
                      <th className="w-[23%] px-2 py-2.5 text-left">{strings.status}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {traceCandidates.map((candidate, index) => {
                      const isRecalled = productRecall.recalled || candidate.recall.recalled
                      return (
                        <tr
                          className="cursor-pointer border-b border-[#edf1f7] text-[0.9rem] transition-colors last:border-b-0 hover:bg-[#f7faff]"
                          key={`${candidate.serial}-${index}`}
                          onClick={() => onSelectCandidate(candidate)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              onSelectCandidate(candidate)
                            }
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          <td className="break-words px-4 py-3.5 font-semibold text-[#2f3b5a]">
                            {formatSerialDisplay(candidate.serial)}
                          </td>
                          <td className="px-2 py-3.5 text-[#4d5b7d]">{formatLotDate(candidate.manufactureDate, locale)}</td>
                          <td className="px-2 py-3.5 text-left">
                            <span
                              className={`inline-flex w-fit items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[0.75rem] font-semibold ${isRecalled
                                ? 'border border-[#d5dae6] bg-[#eef1f6] text-[#6f788f]'
                                : 'border border-[#91e3bf] bg-[#e5faf0] text-[#118457]'
                                }`}
                            >
                              {isRecalled ? strings.statusRecalled : strings.statusActive}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
