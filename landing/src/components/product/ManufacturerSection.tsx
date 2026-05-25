import type { ReactNode } from 'react'
import {
  BuildingIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from '../common/ProductIcons'

interface ManufacturerSectionProps {
  product: any
  title: string
  companyNameLabel: string
  emailLabel: string
  phoneLabel: string
  addressLabel: string
}
export function ManufacturerSection({
  product,
  title,
  companyNameLabel,
  emailLabel,
  phoneLabel,
  addressLabel,
}: ManufacturerSectionProps) {
  return (
    <section className="border-t border-[#e0e0e0] px-5 py-[1.15rem] sm:px-6">
      <h2 className="mb-[0.85rem] text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[#2b3990]">
        {title}
      </h2>

      <div>
        <ManufacturerRow icon={<BuildingIcon />} label={companyNameLabel} value={product.name} valueClassName="font-semibold" />

        <ManufacturerRow
          href={product.contactEmail ? `mailto:${product.contactEmail}` : undefined}
          icon={<MailIcon />}
          label={emailLabel}
          value={product.contactEmail}
          valueClassName="text-[#2b3990] hover:underline"
        />

        <ManufacturerRow
          href={product.contactPhone ? `tel:${product.contactPhone}` : undefined}
          icon={<PhoneIcon />}
          label={phoneLabel}
          value={product.contactPhone}
          valueClassName="text-[#2b3990] hover:underline"
        />

        <ManufacturerRow icon={<MapPinIcon />} label={addressLabel} value={product.address} />
      </div>
    </section>
  )
}

interface ManufacturerRowProps {
  href?: string
  icon: ReactNode
  label: string
  value: string
  valueClassName?: string
}

function ManufacturerRow({ href, icon, label, value, valueClassName }: ManufacturerRowProps) {
  const className = ['m-0 leading-[1.62] text-[#1a1a2e]', valueClassName].filter(Boolean).join(' ')

  return (
    <div className="flex items-start gap-[0.7rem] border-t border-[#f1f3f8] py-[0.8rem] first:border-t-0">
      <span aria-hidden="true" className="mt-0.5 text-[#2b3990]">
        {icon}
      </span>

      <div className="min-w-0 flex-1">
        <p className="mb-[0.22rem] text-[0.86rem] font-semibold uppercase tracking-[0.06em] text-[#6b7280]">
          {label}
        </p>

        {href ? (
          <a className={className} href={href}>
            {value}
          </a>
        ) : (
          <p className={className}>{value}</p>
        )}
      </div>
    </div>
  )
}