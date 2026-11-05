import { useCallback, useEffect, useMemo, useState } from 'react'
import { LanguageContext } from './LanguageContext.js'
import {
  DEFAULT_LANG,
  LANG_STORAGE_KEY,
  SUPPORTED_LANGS,
  translations,
} from './translations.js'
import { formatPrice as formatPriceFor } from '../data/products.js'

function readInitialLang() {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY)
    if (SUPPORTED_LANGS.includes(saved)) return saved
  } catch {
    // ignore storage errors
  }
  return DEFAULT_LANG
}

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitialLang)
  const isRtl = lang === 'ar'

  // Keep <html lang/dir>, the tab title and the meta description in sync with the language.
  useEffect(() => {
    const html = document.documentElement
    html.lang = lang
    html.dir = isRtl ? 'rtl' : 'ltr'
    document.title = translations[lang]['meta.title']
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', translations[lang]['meta.description'])
  }, [lang, isRtl])

  const setLang = useCallback((next) => {
    if (!SUPPORTED_LANGS.includes(next)) return
    setLangState(next)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next)
    } catch {
      // ignore storage errors
    }
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'ar' ? 'en' : 'ar')
  }, [lang, setLang])

  const value = useMemo(() => {
    const dict = translations[lang]
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US'

    const t = (key, vars) => {
      let text = dict[key] ?? translations[DEFAULT_LANG][key] ?? key
      if (vars) {
        for (const [name, val] of Object.entries(vars)) {
          text = text.split(`{${name}}`).join(String(val))
        }
      }
      return text
    }

    const formatNumber = (n) => Number(n || 0).toLocaleString(locale)
    const formatPrice = (n) => formatPriceFor(n, lang)

    // Items from the API / cart carry nameAr + nameEn (and `title` as a legacy fallback).
    const pickName = (item) => {
      if (!item) return ''
      const ar = item.nameAr || ''
      const en = item.nameEn || ''
      const legacy = item.title || ''
      return lang === 'en' ? en || ar || legacy : ar || en || legacy
    }

    const pickDescription = (item) => {
      if (!item) return ''
      const ar = item.descriptionAr || ''
      const en = item.descriptionEn || ''
      const legacy = item.description || ''
      return lang === 'en' ? en || ar || legacy : ar || en || legacy
    }

    return {
      lang,
      isRtl,
      setLang,
      toggleLang,
      t,
      formatNumber,
      formatPrice,
      pickName,
      pickDescription,
    }
  }, [lang, isRtl, setLang, toggleLang])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

