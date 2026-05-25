import { formatFieldValue } from '../../lib/product'
import type { Locale, ProductCustomField, ProductField } from '../../models/product'

interface FieldSectionProps {
  fields: ProductField[]
  locale: Locale
  title: string
  tone: 'primary' | 'muted'
}

export function FieldSection({ fields, locale, title, tone }: FieldSectionProps) {
  if (fields.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#e0e0e0] px-5 py-[1.15rem] sm:px-6">
      <h2
        className={`mb-[0.85rem] text-[0.82rem] font-bold uppercase tracking-[0.08em] ${tone === 'primary' ? 'text-[#2b3990]' : 'text-[#6b7280]'}`}
      >
        {title}
      </h2>

      <div className="divide-y divide-[#f1f3f8]">
        {fields.map((field) => {
          const fieldLabel = locale === 'en' && field.labelEn ? field.labelEn : field.label

          return (
            <div className="flex items-start gap-[0.7rem] py-[0.8rem]" key={field.fieldCode}>
              <span
                aria-hidden="true"
                className="mt-[0.45rem] h-[0.55rem] w-[0.55rem] shrink-0 rounded-full bg-[#2b3990] shadow-[0_0_0_5px_rgba(43,57,144,0.08)]"
              />

              <div className="min-w-0 flex-1">
                <p className="mb-[0.22rem] text-[0.86rem] font-semibold leading-[1.45] text-[#2b3990]">
                  {fieldLabel}
                </p>
                <p className="m-0 whitespace-pre-line leading-[1.62] text-[#1a1a2e]">
                  {formatFieldValue(field, locale)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

interface CustomFieldSectionProps {
  fields: ProductCustomField[]
  title: string
}

export function CustomFieldSection({ fields, title }: CustomFieldSectionProps) {
  if (fields.length === 0) {
    return null
  }

  return (
    <section className="border-t border-[#e0e0e0] px-5 py-[1.15rem] sm:px-6">
      <h2 className="mb-[0.85rem] text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
        {title}
      </h2>

      <div className="divide-y divide-[#f1f3f8]">
        {fields.map((field) => (
          <div className="flex items-start gap-[0.7rem] py-[0.8rem]" key={field.fieldCode}>
            <span
              aria-hidden="true"
              className="mt-[0.45rem] h-[0.55rem] w-[0.55rem] shrink-0 rounded-full bg-[#2b3990] shadow-[0_0_0_5px_rgba(43,57,144,0.08)]"
            />

            <div className="min-w-0 flex-1">
              <p className="mb-[0.22rem] text-[0.86rem] font-semibold leading-[1.45] text-[#2b3990]">
                {field.label}
              </p>
              <p className="m-0 whitespace-pre-line leading-[1.62] text-[#1a1a2e]">{field.value}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}