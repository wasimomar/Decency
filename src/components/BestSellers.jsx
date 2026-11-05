import { useRef, useState } from 'react'
import { products as fallbackProducts } from '../data/products.js'
import { getProducts } from '../services/catalogApi.js'
import { useAsync } from '../hooks/useAsync.js'
import { ChevronLeft, ChevronRight, StarIcon } from './Icons.jsx'
import ProductQuickViewModal from './ProductQuickViewModal.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

function ProductCard({ product, onAdd, onQuickView }) {
  const { t, isRtl, formatNumber, formatPrice, pickName, pickDescription } = useLanguage()
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
        : product.image
          ? [product.image]
          : ['/images/cat-isdal.jpg']

  const imgSrc = images[activeImgIdx] || images[0]

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

  const handleCardClick = () => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    onQuickView?.(product)
  }

  return (
    <article className="group w-[62%] shrink-0 snap-start sm:w-[34%] lg:w-[23.5%] flex flex-col justify-between">
      <div>
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={handleCardClick}
          className="relative aspect-[4/5] cursor-pointer select-none overflow-hidden rounded-card border border-sand bg-cream-deep touch-pan-y"
        >
          <img
            src={imgSrc}
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

          {product.isBestSeller && (
            <span className="absolute left-2.5 top-2.5 z-10 rounded-md bg-olive px-2.5 py-1 text-[11px] font-bold text-cream shadow-sm">
              {t('product.bestSellerBadge')}
            </span>
          )}

          {images.length > 1 && (
            <>
              <span
                dir="ltr"
                className="absolute right-2.5 top-2.5 z-10 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-semibold text-cream backdrop-blur-xs"
              >
                {activeImgIdx + 1}/{images.length}
              </span>
              <button
                type="button"
                onClick={handlePrevImage}
                aria-label={t('product.prevImage')}
                className="absolute start-2 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-cream/90 text-ink shadow-sm transition opacity-95 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-cream active:scale-90"
              >
                <PrevIcon width={14} height={14} />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                aria-label={t('product.nextImage')}
                className="absolute end-2 top-1/2 z-10 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-cream/90 text-ink shadow-sm transition opacity-95 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-cream active:scale-90"
              >
                <NextIcon width={14} height={14} />
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
        <div onClick={() => onQuickView?.(product)} className="cursor-pointer">
          <h3 className="mt-3 text-[0.95rem] font-semibold text-ink transition group-hover:text-olive">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 line-clamp-1 text-xs text-muted">{description}</p>
          ) : product.rating ? (
            <div className="mt-1 flex items-center gap-1 text-xs text-muted">
              <StarIcon className="text-star" />
              <span>{formatNumber(product.rating)}</span>
              {product.reviews && <span>({formatNumber(product.reviews)})</span>}
            </div>
          ) : null}
          <p className="mt-1 font-medium text-olive">{formatPrice(product.price)}</p>
        </div>
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
            : 'border-olive text-olive hover:bg-olive hover:text-cream'
        }`}
      >
        {added ? t('product.added') : t('product.add')}
      </button>
    </article>
  )
}

export default function BestSellers({ onAdd }) {
  const { t, isRtl } = useLanguage()
  const track = useRef(null)
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const { data: apiProducts } = useAsync(getProducts)

  const baseProducts =
    Array.isArray(apiProducts) && apiProducts.length > 0 ? apiProducts : fallbackProducts
  const displayProducts = baseProducts.filter((p) => p.isBestSeller)

  // RTL: positive scrollBy moves toward the start (right). LTR: positive moves toward the end (right = next).
  const scroll = (direction) => {
    const el = track.current
    const sign = direction === 'prev' ? (isRtl ? 1 : -1) : isRtl ? -1 : 1
    el?.scrollBy({ left: sign * el.clientWidth * 0.8, behavior: 'smooth' })
  }

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  return (
    <section
      id="best-sellers"
      aria-labelledby="best-title"
      className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-14 sm:px-8 sm:pt-20"
    >
      <div className="mb-6 flex items-end justify-between sm:mb-9">
        <h2 id="best-title" className="text-2xl font-semibold text-olive sm:text-3xl">{t('best.title')}</h2>
        {displayProducts.length > 0 && (
          <div className="hidden gap-2 sm:flex">
            <button type="button" onClick={() => scroll('prev')} aria-label={t('best.prev')} className="grid size-10 place-items-center rounded-full border border-sand text-olive transition hover:bg-sand/60">
              <PrevIcon />
            </button>
            <button type="button" onClick={() => scroll('next')} aria-label={t('best.next')} className="grid size-10 place-items-center rounded-full border border-sand text-olive transition hover:bg-sand/60">
              <NextIcon />
            </button>
          </div>
        )}
      </div>
      {displayProducts.length === 0 ? (
        <div className="rounded-card border border-sand bg-cream-deep/50 px-6 py-10 text-center text-sm text-muted">
          {t('best.empty')}
        </div>
      ) : (
        <div ref={track} className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          {displayProducts.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={onAdd}
              onQuickView={setQuickViewProduct}
            />
          ))}
        </div>
      )}

      <ProductQuickViewModal
        product={quickViewProduct}
        onAdd={onAdd}
        onClose={() => setQuickViewProduct(null)}
      />
    </section>
  )
}
