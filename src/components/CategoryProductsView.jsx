import { useMemo, useRef, useState } from 'react'
import {
  getCategories,
  getProductsByCategory,
  getProductsBySubcategory,
  getSubcategoriesByCategory,
} from '../services/catalogApi.js'
import { useAsync } from '../hooks/useAsync.js'
import { ChevronLeft, ChevronRight } from './Icons.jsx'
import ProductQuickViewModal from './ProductQuickViewModal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

function ProductGridSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4"
    >
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="space-y-3">
          <div className="aspect-[4/5] animate-pulse rounded-card border border-sand bg-cream-deep" />
          <div className="h-4 w-3/4 animate-pulse rounded-full bg-sand/70" />
          <div className="h-3 w-full animate-pulse rounded-full bg-sand/50" />
          <div className="h-4 w-1/3 animate-pulse rounded-full bg-sand/70" />
          <div className="h-10 w-full animate-pulse rounded-full bg-sand/60" />
        </div>
      ))}
    </div>
  )
}

function StoreProductCard({ product, subcategoryName, onAdd, onQuickView }) {
  const { t, isRtl, formatPrice, pickName, pickDescription } = useLanguage()
  const [added, setAdded] = useState(false)
  const [activeImgIdx, setActiveImgIdx] = useState(0)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)
  const didSwipe = useRef(false)

  const title = pickName(product)
  const description = pickDescription(product)
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  const images =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : ['/images/cat-isdal.jpg']

  const currentImage = images[activeImgIdx] || images[0]

  const handlePrevImage = (e) => {
    e?.stopPropagation()
    setActiveImgIdx((prev) => (prev - 1 + images.length) % images.length)
  }

  const handleNextImage = (e) => {
    e?.stopPropagation()
    setActiveImgIdx((prev) => (prev + 1) % images.length)
  }

  const handleTouchStart = (e) => {
    didSwipe.current = false
    if (images.length <= 1) return
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  const handleTouchEnd = (e) => {
    if (images.length <= 1 || touchStartX.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - (touchStartY.current ?? 0)
    touchStartX.current = null
    touchStartY.current = null

    if (Math.abs(deltaX) < 30 || Math.abs(deltaX) < Math.abs(deltaY)) return
    didSwipe.current = true
    // Swiping toward the "end" of the reading direction reveals the next image.
    const goNext = isRtl ? deltaX > 0 : deltaX < 0
    if (goNext) {
      handleNextImage()
    } else {
      handlePrevImage()
    }
  }

  const handleCardImageClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    onQuickView?.(product)
  }

  return (
    <article className="group flex flex-col justify-between rounded-card border border-sand/80 bg-white/60 p-2.5 sm:p-3.5 transition hover:border-olive/40 hover:bg-white hover:shadow-md">
      <div>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardImageClick}
          className="relative aspect-[4/5] cursor-pointer select-none overflow-hidden rounded-xl border border-sand bg-cream-deep touch-pan-y"
        >
          <img
            src={currentImage}
            alt={title}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src !== '/images/cat-isdal.jpg') {
                e.currentTarget.src = '/images/cat-isdal.jpg'
              }
            }}
            className="size-full object-cover transition-transform duration-700 ease-calm group-hover:scale-105"
          />

          {/* Best Seller Badge (Top-Left) */}
          {product.isBestSeller && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-olive px-2.5 py-1 text-[11px] font-bold text-cream shadow-sm">
              {t('product.bestSellerBadge')}
            </span>
          )}

          {/* Subcategory badge or image counter (Top-Right) */}
          <div className="absolute right-2.5 top-2.5 z-10 flex flex-col items-end gap-1">
            {subcategoryName && (
              <span className="rounded-full bg-cream/90 px-2.5 py-1 text-[11px] font-semibold text-olive shadow-xs backdrop-blur-xs">
                {subcategoryName}
              </span>
            )}
            {images.length > 1 && (
              <span
                dir="ltr"
                className="rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-cream backdrop-blur-xs"
              >
                {activeImgIdx + 1}/{images.length}
              </span>
            )}
          </div>

          {/* Multiple Images Controls (Visible on mobile + hover on desktop) */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label={t('product.prevImage')}
                className="absolute start-2 top-1/2 z-10 -translate-y-1/2 grid size-7 sm:size-8 place-items-center rounded-full bg-cream/90 text-ink shadow-sm transition opacity-95 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-cream active:scale-90"
              >
                <PrevIcon width={15} height={15} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label={t('product.nextImage')}
                className="absolute end-2 top-1/2 z-10 -translate-y-1/2 grid size-7 sm:size-8 place-items-center rounded-full bg-cream/90 text-ink shadow-sm transition opacity-95 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-cream active:scale-90"
              >
                <NextIcon width={15} height={15} />
              </button>
              <div className="absolute inset-x-0 bottom-2.5 z-10 flex items-center justify-center gap-1.5">
                {images.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveImgIdx(idx)
                    }}
                    aria-label={t('product.imageN', { n: idx + 1 })}
                    className={`h-1.5 rounded-full transition-all shadow-xs ${
                      idx === activeImgIdx ? 'w-5 bg-olive' : 'w-1.5 bg-cream/85'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          onClick={() => onQuickView?.(product)}
          className="mt-3 cursor-pointer px-1"
        >
          <h3 className="text-base font-bold text-ink transition group-hover:text-olive">
            {title}
          </h3>
          {description && (
            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 px-1 pt-2 border-t border-sand/60">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted">{t('product.price')}</span>
          <p className="text-base font-bold text-olive">{formatPrice(product.price)}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            onAdd?.(product, 1)
            setAdded(true)
            setTimeout(() => setAdded(false), 1200)
          }}
          className={`mt-3 w-full rounded-full border py-2.5 text-sm font-medium transition active:scale-[0.98] ${
            added
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : 'border-olive bg-olive text-cream hover:bg-olive-soft'
          }`}
        >
          {added ? t('product.added') : t('product.add')}
        </button>
      </div>
    </article>
  )
}

export default function CategoryProductsView({
  categoryId,
  initialSubcategoryId = null,
  onSelectCategory,
  onSelectSubcategory,
  onBackToHome,
  onAdd,
}) {
  const { t, formatNumber, pickName } = useLanguage()
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const activeSubcategoryId = initialSubcategoryId || null

  const { data: categoriesData } = useAsync(getCategories, [])
  const { data: subcategoriesData, loading: loadingMeta } = useAsync(
    () => (categoryId ? getSubcategoriesByCategory(categoryId) : Promise.resolve([])),
    [categoryId],
  )
  const {
    data: productsData,
    loading: loadingProducts,
    error,
    reload: reloadProducts,
  } = useAsync(
    () =>
      activeSubcategoryId
        ? getProductsBySubcategory(activeSubcategoryId)
        : getProductsByCategory(categoryId),
    [categoryId, activeSubcategoryId],
    Boolean(categoryId || activeSubcategoryId),
  )

  const categories = useMemo(() => categoriesData || [], [categoriesData])
  const subcategories = useMemo(() => subcategoriesData || [], [subcategoriesData])
  const products = useMemo(() => productsData || [], [productsData])

  const currentCategory = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId],
  )

  const activeSubcategory = useMemo(
    () => subcategories.find((s) => s.id === activeSubcategoryId),
    [subcategories, activeSubcategoryId],
  )

  const currentCategoryName = currentCategory ? pickName(currentCategory) : ''
  const activeSubcategoryName = activeSubcategory ? pickName(activeSubcategory) : ''

  // Resolved at render time so names switch instantly when the language changes.
  const subcategoryNameOf = (id) => {
    const sub = subcategories.find((s) => s.id === id)
    return sub ? pickName(sub) : ''
  }

  const handleSubcategoryClick = (subId) => {
    onSelectSubcategory?.(subId)
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12 min-h-[65vh]">
      {/* Breadcrumb & Back Navigation */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <nav aria-label={t('catview.breadcrumb')} className="flex items-center gap-2 text-sm text-muted">
          <button
            type="button"
            onClick={onBackToHome}
            className="font-medium text-ink/80 transition hover:text-olive"
          >
            {t('catview.home')}
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => handleSubcategoryClick(null)}
            className={`font-semibold transition ${
              activeSubcategory ? 'text-ink/80 hover:text-olive' : 'text-olive'
            }`}
          >
            {currentCategoryName || t('catview.section')}
          </button>
          {activeSubcategory && (
            <>
              <span>/</span>
              <span className="font-semibold text-olive">{activeSubcategoryName}</span>
            </>
          )}
        </nav>

        <button
          type="button"
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 rounded-full border border-sand-dark bg-white/80 px-4 py-2 text-xs font-semibold text-ink transition hover:bg-sand/60 active:scale-95"
        >
          <span>{t('catview.backAll')}</span>
        </button>
      </div>

      {/* Category Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-sand bg-cream-deep p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {currentCategory?.imageUrl && (
              <div className="size-16 sm:size-20 shrink-0 overflow-hidden rounded-2xl border border-sand bg-white shadow-xs">
                <img
                  src={currentCategory.imageUrl}
                  alt={currentCategoryName}
                  referrerPolicy="no-referrer"
                  className="size-full object-cover"
                />
              </div>
            )}
            <div>
              <span className="inline-block rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold text-olive">
                {t('categories.title')}
              </span>
              <h1 className="mt-1.5 text-2xl font-bold text-ink sm:text-3xl">
                {activeSubcategory
                  ? `${currentCategoryName} — ${activeSubcategoryName}`
                  : currentCategoryName || t('catview.productsOfSection')}
              </h1>
              <p className="mt-1 text-xs text-muted sm:text-sm">
                {loadingProducts
                  ? t('catview.loading')
                  : t('catview.count', { n: formatNumber(products.length) })}
              </p>
            </div>
          </div>

          {/* Other Categories Quick Switcher */}
          {categories.length > 1 && (
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isCurrent = cat.id === categoryId
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory?.(cat.id)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      isCurrent
                        ? 'bg-olive text-cream shadow-xs'
                        : 'border border-sand bg-white/70 text-ink hover:bg-sand/60'
                    }`}
                  >
                    {pickName(cat)}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Subcategories Filter Bar inside Category */}
        {!loadingMeta && subcategories.length > 0 && (
          <div className="mt-6 border-t border-sand/80 pt-5">
            <span className="mb-3 block text-xs font-semibold text-muted">
              {t('catview.subsInside', { name: currentCategoryName })}
            </span>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleSubcategoryClick(null)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95 ${
                  !activeSubcategoryId
                    ? 'bg-olive text-cream shadow-xs'
                    : 'border border-sand bg-white/80 text-ink hover:bg-sand/60'
                }`}
              >
                <span>{t('catview.all')}</span>
              </button>

              {subcategories.map((sub) => {
                const isSelected = activeSubcategoryId === sub.id
                const subName = pickName(sub)
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleSubcategoryClick(sub.id)}
                    className={`inline-flex items-center gap-2.5 rounded-full py-1.5 pe-4 ps-2 text-sm font-semibold transition active:scale-95 ${
                      isSelected
                        ? 'bg-olive text-cream shadow-xs'
                        : 'border border-sand bg-white/80 text-ink hover:bg-sand/60'
                    }`}
                  >
                    {sub.imageUrl && (
                      <img
                        src={sub.imageUrl}
                        alt={subName}
                        referrerPolicy="no-referrer"
                        className="size-7 rounded-full object-cover border border-sand"
                      />
                    )}
                    <span>{subName}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Products Section */}
      <div className="mt-8">
        {loadingProducts ? (
          <ProductGridSkeleton />
        ) : error ? (
          <div
            role="alert"
            className="rounded-card border border-sand bg-cream-deep px-6 py-12 text-center"
          >
            <p className="text-base font-medium text-ink">{error.message}</p>
            <button
              type="button"
              onClick={reloadProducts}
              className="mt-4 rounded-full bg-olive px-6 py-2.5 text-sm font-medium text-cream transition hover:bg-olive-soft active:scale-95"
            >
              {t('header.retry')}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-card border border-sand bg-white/50 px-6 py-16 text-center">
            <p className="text-lg font-bold text-ink">{t('catview.emptyTitle')}</p>
            <p className="mt-1 text-sm text-muted">
              {activeSubcategory
                ? t('catview.emptySub', { name: activeSubcategoryName })
                : t('catview.emptyCat', { name: currentCategoryName })}
            </p>
            {activeSubcategoryId && (
              <button
                type="button"
                onClick={() => handleSubcategoryClick(null)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-olive px-6 py-2.5 text-sm font-medium text-cream transition hover:bg-olive-soft"
              >
                {t('catview.viewAllOf', { name: currentCategoryName })}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <StoreProductCard
                key={product.id}
                product={product}
                subcategoryName={
                  product.subcategoryId ? subcategoryNameOf(product.subcategoryId) : null
                }
                onAdd={onAdd}
                onQuickView={setQuickViewProduct}
              />
            ))}
          </div>
        )}
      </div>

      {/* Product Quick View Modal / Bottom Sheet */}
      <ProductQuickViewModal
        product={quickViewProduct}
        categoryName={currentCategoryName}
        subcategoryName={
          quickViewProduct?.subcategoryId ? subcategoryNameOf(quickViewProduct.subcategoryId) : ''
        }
        onAdd={onAdd}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  )
}
