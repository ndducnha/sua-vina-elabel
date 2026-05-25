import type { Locale, ProductCategory, ProductField, ProductMediaLink } from '../models/product'

export function formatDate(value: string, locale: Locale) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatFieldValue(field: ProductField, locale: Locale) {
  if (field.fieldType === 'date') {
    return formatDate(field.value, locale)
  }

  if (field.fieldType === 'number') {
    const numericValue = Number(field.value)

    if (!Number.isNaN(numericValue)) {
      return numericValue.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')
    }
  }

  return field.value
}

export function getCategoryName(category: ProductCategory, locale: Locale) {
  if (locale === 'en') {
    return category.nameEn ?? category.nameVi
  }

  return category.nameVi
}

export function getYoutubeId(url: string) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? null
}

export function groupMediaLinks(mediaLinks: ProductMediaLink[]) {
  return {
    images: mediaLinks.filter((mediaLink) => mediaLink.type === 'image'),
    videos: mediaLinks.filter((mediaLink) => mediaLink.type === 'video'),
    documents: mediaLinks.filter((mediaLink) => mediaLink.type === 'document'),
  }
}