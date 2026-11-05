import { useLanguage } from '../i18n/useLanguage.js'

export default function Hero() {
  const { t } = useLanguage()

  return (
    <section aria-labelledby="hero-title" className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 sm:pt-6">
      <div className="relative overflow-hidden rounded-hero bg-cream-deep">
        <img
          src="/images/hero.jpg"
          alt={t('hero.alt')}
          fetchPriority="high"
          className="h-[30rem] w-full object-cover object-[78%_center] sm:h-[34rem] lg:h-[38rem]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cream/95 via-cream/40 to-transparent sm:bg-gradient-to-r sm:from-cream/90 sm:via-cream/30 sm:to-transparent" />

        <div className="hero-caption absolute inset-x-0 bottom-0 p-6 sm:inset-y-0 sm:left-0 sm:right-auto sm:flex sm:w-[50%] sm:flex-col sm:justify-center sm:p-14">
          <h1 id="hero-title" className="text-[1.65rem] font-semibold leading-[1.55] text-olive sm:text-4xl lg:text-[2.6rem]">
            {t('hero.title')}
          </h1>
          <p className="mt-3 max-w-md text-base leading-8 text-ink/80 sm:text-lg">
            {t('hero.subtitle')}
          </p>
          <a
            id="hero-cta"
            href="#categories"
            className="mt-6 inline-flex w-fit items-center rounded-full bg-olive px-8 py-3.5 text-sm font-medium text-cream transition hover:bg-ink active:scale-[0.98]"
          >
            {t('hero.cta')}
          </a>
        </div>
      </div>
    </section>
  )
}
