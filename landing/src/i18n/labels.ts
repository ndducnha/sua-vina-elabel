import type { Labels, Locale } from '../models/product'
import enLabels from './locales/labels.en.json'
import viLabels from './locales/labels.vi.json'

const labels: Record<Locale, Labels> = {
  vi: viLabels,
  en: enLabels,
}

export function getLabels(locale: Locale) {
  return labels[locale]
}