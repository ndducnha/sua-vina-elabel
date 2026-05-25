import { create } from 'zustand'
import type { Locale, ProductTab } from '../models/product'

interface ProductViewState {
  activeTab: ProductTab
  locale: Locale
  setActiveTab: (tab: ProductTab) => void
  setLocale: (locale: Locale) => void
  toggleLocale: () => void
}

export const useProductViewStore = create<ProductViewState>((set) => ({
  activeTab: 'label',
  locale: 'vi',
  setActiveTab: (activeTab) => set({ activeTab }),
  setLocale: (locale) => set({ locale }),
  toggleLocale: () =>
    set((state) => ({
      locale: state.locale === 'vi' ? 'en' : 'vi',
    })),
}))