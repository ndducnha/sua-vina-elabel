import { BottomSheet } from '@/components/common/BottomSheet'
import { LotLookupPanel, type LotLookupStrings } from '@/components/common/LotLookupPanel'
import type { ProductLot } from '@/models/batch'
import type { Locale } from '@/models/product'

type BatchLookupBottomSheetProps = {
  canLookup: boolean
  closeLabel: string
  formatLotDate: (raw: string, loc: Locale) => string
  locale: Locale
  lookupDate: string
  lookupError: string | null
  lookupLoading: boolean
  lookupSerial: string
  onClearLookupError: () => void
  onClose: () => void
  onLookupDateChange: (value: string) => void
  onLookupSerialChange: (value: string) => void
  onRunLookup: () => void
  onSelectCandidate: (lot: ProductLot) => void
  open: boolean
  productRecall: { recalled: boolean }
  serialValidationError: string | null
  strings: LotLookupStrings
  title: string
  traceCandidates: ProductLot[]
  traceMode: 'list' | 'lookup'
  onCancelLookup?: () => void
  showCancelLookup?: boolean
}

export function BatchLookupBottomSheet({
  canLookup,
  closeLabel,
  formatLotDate,
  locale,
  lookupDate,
  lookupError,
  lookupLoading,
  lookupSerial,
  onClearLookupError,
  onClose,
  onLookupDateChange,
  onLookupSerialChange,
  onRunLookup,
  onSelectCandidate,
  open,
  productRecall,
  serialValidationError,
  strings,
  title,
  traceCandidates,
  traceMode,
  onCancelLookup,
  showCancelLookup,
}: BatchLookupBottomSheetProps) {
  return (
    <BottomSheet closeLabel={closeLabel} onClose={onClose} open={open} title={title}>
      <div className="pb-1">
        <LotLookupPanel
          canLookup={canLookup}
          formatLotDate={formatLotDate}
          isLotSpecificScan={false}
          locale={locale}
          lookupDate={lookupDate}
          lookupError={lookupError}
          lookupLoading={lookupLoading}
          lookupSerial={lookupSerial}
          onClearLookupError={onClearLookupError}
          onLookupDateChange={onLookupDateChange}
          onLookupSerialChange={onLookupSerialChange}
          onRunLookup={onRunLookup}
          onSelectCandidate={onSelectCandidate}
          productRecall={productRecall}
          serialValidationError={serialValidationError}
          strings={strings}
          traceCandidates={traceCandidates}
          traceMode={traceMode}
          variant="sheet"
          onCancelLookup={onCancelLookup}
          showCancelLookup={showCancelLookup}
        />
      </div>
    </BottomSheet>
  )
}
