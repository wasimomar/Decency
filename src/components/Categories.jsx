import { getCategories } from '../services/catalogApi.js'
import { useAsync } from '../hooks/useAsync.js'
import { useLanguage } from '../i18n/useLanguage.js'

function CategorySkeleton() {
  return (
    <li aria-hidden="true">
      <div className="aspect-[4/5] animate-pulse rounded-card border border-sand bg-cream-deep" />
      <div className="mx-auto mt-3 h-4 w-2/3 animate-pulse rounded-full bg-sand/70" />
    </li>
  )
}

// Picks a local fallback photo from either the Arabic or the English name.
function getCategoryFallback(nameAr = '', nameEn = '') {
  const ar = nameAr
  const en = nameEn.toLowerCase()
  if (ar.includes('إسدال') || ar.includes('اسدال') || en.includes('esdal') || en.includes('isdal')) return '/images/cat-isdal.jpg'
  if (ar.includes('سجاد') || en.includes('mat') || en.includes('rug')) return '/images/cat-mats.jpg'
  if (ar.includes('أطفال') || ar.includes('اطفال') || en.includes('kid') || en.includes('child')) return '/images/cat-kids.jpg'
  if (ar.includes('هدية') || ar.includes('هدايا') || ar.includes('طقم') || en.includes('gift') || en.includes('set')) return '/images/cat-gifts.jpg'
  return '/images/cat-isdal.jpg'
}

export default function Categories({ onSelectCategory }) {
  const { t, pickName } = useLanguage()
  const { data: categories, loading, error, reload } = useAsync(getCategories)

  const handleCategoryClick = (e, categoryId) => {
    if (onSelectCategory) {
      e.preventDefault()
      onSelectCategory(categoryId)
    }
  }

  return (
    <section id="categories" aria-labelledby="cat-title" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-8 sm:pt-20">
      <h2 id="cat-title" className="mb-6 text-2xl font-semibold text-olive sm:mb-9 sm:text-3xl">
        {t('categories.title')}
      </h2>

      {error && (
        <div role="alert" className="rounded-card border border-sand bg-cream-deep px-6 py-10 text-center">
          <p className="text-ink">{error.message}</p>
          <button
            id="categories-retry"
            type="button"
            onClick={reload}
            className="mt-4 rounded-full bg-olive px-6 py-2.5 text-sm font-medium text-cream transition active:scale-95"
          >
            {t('header.retry')}
          </button>
        </div>
      )}

      {!error && (
        <ul
          aria-busy={loading}
          className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
        >
          {loading && Array.from({ length: 4 }, (_, i) => <CategorySkeleton key={i} />)}
          {categories?.map((c) => {
            const title = pickName(c)
            const fallbackSrc = getCategoryFallback(c.nameAr, c.nameEn)
            return (
              <li key={c.id}>
                <a
                  href={`#category-${c.id}`}
                  onClick={(e) => handleCategoryClick(e, c.id)}
                  className="group block"
                >
                  <div className="aspect-[4/5] overflow-hidden rounded-card border border-sand bg-cream-deep">
                    <img
                      src={c.imageUrl || c.image || fallbackSrc}
                      alt={title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        if (e.currentTarget.src !== fallbackSrc) {
                          e.currentTarget.src = fallbackSrc
                        }
                      }}
                      className="size-full object-cover transition-transform duration-700 ease-calm group-hover:scale-110"
                    />
                  </div>
                  <h3 className="mt-3 text-center text-[0.95rem] font-bold text-ink sm:text-base">{title}</h3>
                </a>
              </li>
            )
          })}
        </ul>
      )}

      {!loading && !error && categories?.length === 0 && (
        <p className="py-10 text-center text-muted">{t('categories.empty')}</p>
      )}
    </section>
  )
}
