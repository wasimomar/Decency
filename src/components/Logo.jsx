import { useState } from 'react'
import { useLanguage } from '../i18n/useLanguage.js'

// Uses /public/logo/logo.png when present; falls back to the text wordmark.
// `hideTaglineOnMobile` keeps the compact top bar from overflowing on narrow phones.
export default function Logo({ className = '', hideTaglineOnMobile = false }) {
  const [failed, setFailed] = useState(false)
  const { t } = useLanguage()

  return (
    <a href="/" aria-label={t('logo.aria')} className={`flex flex-col items-center leading-none ${className}`}>
      {failed ? (
        <span className="font-brand text-[1.6rem] sm:text-3xl font-semibold tracking-[0.32em] ps-[0.32em] text-olive">
          DECENCY
        </span>
      ) : (
        <img
          src="/logo/logo-transparent.png"
          alt="DECENCY"
          className="h-14 sm:h-[4.5rem] w-auto"
          onError={() => setFailed(true)}
        />
      )}
      <span
        className={`mt-1.5 text-[0.5rem] sm:text-[0.62rem] tracking-[0.22em] text-muted ${hideTaglineOnMobile ? 'hidden sm:block' : ''}`}
        dir="ltr"
      >
        MODESTY • COMFORT • ELEGANCE
      </span>
    </a>
  )
}
