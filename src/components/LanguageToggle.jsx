import { GlobeIcon } from './Icons.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

// Switches the whole storefront between Arabic (RTL) and English (LTR).
export default function LanguageToggle() {
  const { t, toggleLang } = useLanguage()

  return (
    <button
      id="toggle-language"
      type="button"
      onClick={toggleLang}
      aria-label={t('lang.switchAria')}
      className="inline-flex items-center gap-1.5 rounded-full border border-sand-dark/70 px-2.5 py-1.5 text-xs font-semibold text-olive transition active:scale-95 hover:bg-sand/60 sm:px-3 sm:text-sm"
    >
      <GlobeIcon width={17} height={17} />
      <span>{t('lang.toggleLabel')}</span>
    </button>
  )
}

