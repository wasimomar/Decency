import { useContext } from 'react'
import { LanguageContext } from './LanguageContext.js'

// Returns { lang, isRtl, setLang, toggleLang, t, formatNumber, formatPrice, pickName, pickDescription }.
export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider>')
  }
  return ctx
}

