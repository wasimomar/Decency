import { ArrowLeft } from './Icons.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

export default function B2BBanner() {
  const { t } = useLanguage()

  return (
    <section
      id="b2b-section"
      aria-labelledby="b2b-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-8 sm:pt-20"
    >
      <div className="grid overflow-hidden rounded-hero border border-sand bg-cream-deep md:grid-cols-2">
        <div className="flex flex-col justify-center p-7 sm:p-12">
          <h2 id="b2b-title" className="text-2xl font-semibold leading-snug text-olive sm:text-3xl">
            {t('b2b.title')}
          </h2>
          <p className="mt-4 max-w-md leading-8 text-ink/75">
            {t('b2b.text')}
          </p>
          <a
            id="b2b-cta"
            href="https://wa.me/201149953702"
            target="_blank"
            rel="noopener noreferrer"
            className="group mt-7 inline-flex w-fit items-center gap-2 border-b border-olive pb-1 text-sm font-medium text-olive transition hover:opacity-80"
          >
            {t('b2b.cta')}
            {/* Arrow points toward the reading direction: left in Arabic, right in English */}
            <ArrowLeft className="transition-transform ltr:rotate-180 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
          </a>
        </div>
        <div className="order-first aspect-[4/3] md:order-none md:aspect-auto">
          <img
            src="/images/b2b.jpg"
            alt={t('b2b.alt')}
            loading="lazy"
            className="size-full object-cover"
          />
        </div>
      </div>
    </section>
  )
}
