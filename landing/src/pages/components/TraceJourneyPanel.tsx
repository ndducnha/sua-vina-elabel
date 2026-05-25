import type { ReactNode } from 'react'
import { Check, ChevronDown, ChevronUp, Circle } from 'lucide-react'
import productLandingEn from '@/i18n/locales/productLanding.en.json'
import productLandingVi from '@/i18n/locales/productLanding.vi.json'
import type { Locale } from '@/models/product'
import type { TraceabilityEvent } from '@/pages/utils/batch-utils'

const landingCopy = {
  en: productLandingEn,
  vi: productLandingVi,
} as const

function TraceSectionBody({ children, isOpen }: { children: ReactNode; isOpen: boolean }) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
    >
      <div className="overflow-hidden">{children}</div>
    </div>
  )
}

export function TraceJourneyPanel({
  events,
  openEvents,
  locale,
  onToggle,
}: {
  events: TraceabilityEvent[]
  openEvents: Record<string, boolean>
  locale: Locale
  onToggle: (eventId: string) => void
}) {
  const ui = landingCopy[locale]
  if (!events || events.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-[#dce3f3] bg-[#fbfcff] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-[1rem] font-semibold text-[#1f2d79]">
          {ui.productJourneyTitle}
        </h3>
        <span className="rounded-full bg-[#ecf2ff] px-2 py-0.5 text-xs font-semibold text-[#3150c2]">
          {events.length} {ui.eventsUnit}
        </span>
      </div>

      <div className="space-y-3">
        {events.map((event, index) => (
          <TraceTimelineEvent
            event={event}
            isLast={index === events.length - 1}
            isOpen={openEvents[event.id] ?? true}
            key={event.id}
            locale={locale}
            onToggle={() => onToggle(event.id)}
          />
        ))}
      </div>
    </section>
  )
}

function TraceTimelineEvent({
  event,
  isLast,
  isOpen,
  locale,
  onToggle,
}: {
  event: TraceabilityEvent
  isLast: boolean
  isOpen: boolean
  locale: Locale
  onToggle: () => void
}) {
  return (
    <div className="relative pl-7">
      {!isLast ? <span className="absolute bottom-0 left-[13px] top-7 w-px bg-[#cfd8ea]" /> : null}
      <span className="absolute left-[6px] top-4 inline-flex h-[14px] w-[14px] items-center justify-center rounded-full border-2 border-[#2f76cb] bg-white text-[#2f76cb]">
        <Circle size={8} fill="currentColor" strokeWidth={0} />
      </span>

      <div className="overflow-hidden rounded-xl border border-[#d8e1f2] bg-[#f8fbff]">
        <button
          className="flex w-full items-center justify-between gap-3 border-b border-[#dfe7f5] bg-[#edf3ff] px-3 py-2.5 text-left"
          onClick={onToggle}
          type="button"
        >
          <span className="min-w-0">
            <span className="block text-[1.03rem] font-semibold text-[#1f4d9f]">{event.title}</span>
            <span className="block text-[0.9rem] text-[#3f527f]">{event.occurredAt}</span>
          </span>
          <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[#3f527f]">
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </span>
        </button>

        <TraceSectionBody isOpen={isOpen}>
          <div className="bg-white">
            {event.verified ? (
              <div className="px-3 pb-1.5 pt-2.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-[#a7ebcf] bg-[#e6fbf1] px-2 py-0.5 text-[0.75rem] font-semibold text-[#128456]">
                  <Check size={12} />
                  {locale === 'en'
                    ? 'Information authenticated on Blockchain'
                    : 'Thông tin đã được xác thực trên Blockchain'}
                </span>
              </div>
            ) : null}

            {event.rows.map((row) => (
              <div className="grid grid-cols-[115px_minmax(0,1fr)] gap-3 border-t border-[#e9edf5] px-3 py-2.5" key={`${event.id}-${row.label}`}>
                <span className="text-[0.86rem] text-[#6a7898]">{row.label}</span>
                <span className="min-w-0 whitespace-pre-line text-[0.9rem] font-medium leading-6 text-[#1f2b45]">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </TraceSectionBody>
      </div>
    </div>
  )
}
