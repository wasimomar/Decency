import { useEffect, useRef, useState } from 'react'
import { BagIcon, ChevronLeft, ChevronRight, CloseIcon } from './Icons.jsx'
import { useLanguage } from '../i18n/useLanguage.js'

function QuickViewContent({ product, categoryName, subcategoryName, onAdd, onClose }) {
  const { t, isRtl, formatNumber, formatPrice, pickName, pickDescription } = useLanguage()
  const [activeIdx, setActiveIdx] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [addedFeedback, setAddedFeedback] = useState(false)
  const touchStartX = useRef(null)
  const touchStartY = useRef(null)

  const title = pickName(product)
  const secondaryName = isRtl ? product?.nameEn : product?.nameAr
  const description = pickDescription(product)
  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight

  const images =
    Array.isArray(product?.images) && product.images.length > 0
      ? product.images
      : product?.imageUrl
        ? [product.imageUrl]
        : product?.image
          ? [product.image]
          : ['/images/cat-isdal.jpg']

  const currentImage = images[activeIdx] || images[0]

  const goPrev = () => {
    setActiveIdx((prev) => (prev - 1 + images.length) % images.length)
  }

  const goNext = () => {
    setActiveIdx((prev) => (prev + 1) % images.length)
  }

  const handleTouchStart = (e) => {
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

    // Ignore vertical scrolling gestures
    if (Math.abs(deltaX) < 35 || Math.abs(deltaX) < Math.abs(deltaY)) return

    // Swiping toward the "end" of the reading direction reveals the next image.
    const forward = isRtl ? deltaX > 0 : deltaX < 0
    if (forward) {
      goNext()
    } else {
      goPrev()
    }
  }

  const handleAddToCart = () => {
    onAdd?.(product, quantity)
    setAddedFeedback(true)
    setTimeout(() => {
      setAddedFeedback(false)
    }, 1400)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
      className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-y-auto rounded-t-3xl border border-sand bg-cream shadow-2xl sm:rounded-3xl md:grid md:grid-cols-[1.08fr_1fr] md:overflow-hidden"
    >
      {/* Mobile drag handle indicator */}
      <div className="flex justify-center pt-2.5 pb-1 md:hidden">
        <span className="h-1.5 w-12 rounded-full bg-sand-dark/60" />
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('quick.close')}
        className="absolute end-3.5 top-3.5 z-20 grid size-10 place-items-center rounded-full border border-sand bg-cream/90 text-ink shadow-sm backdrop-blur-xs transition hover:bg-sand active:scale-90"
      >
        <CloseIcon width={18} height={18} />
      </button>

      {/* Image Gallery */}
      <div className="flex flex-col bg-cream-deep/60 p-2.5 sm:p-5">
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative aspect-[3/4] w-full select-none overflow-hidden rounded-2xl border border-sand bg-cream-deep touch-pan-y"
        >
          <img
            key={currentImage}
            src={currentImage}
            alt={`${title} - ${t('product.imageN', { n: activeIdx + 1 })}`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              if (e.currentTarget.src !== '/images/cat-isdal.jpg') {
                e.currentTarget.src = '/images/cat-isdal.jpg'
              }
            }}
            className="size-full object-contain transition-opacity duration-300"
          />

          {/* Image Counter Badge */}
          {images.length > 1 && (
            <div
              dir="ltr"
              className="absolute start-3 top-3 rounded-full bg-ink/75 px-3 py-1 text-xs font-semibold text-cream backdrop-blur-xs"
            >
              {activeIdx + 1} / {images.length}
            </div>
          )}

          {/* Previous / Next Buttons */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label={t('product.prevImage')}
                className="absolute start-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full border border-sand/60 bg-cream/90 text-ink shadow-md backdrop-blur-xs transition hover:bg-olive hover:text-cream active:scale-90"
              >
                <PrevIcon width={20} height={20} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label={t('product.nextImage')}
                className="absolute end-3 top-1/2 -translate-y-1/2 grid size-10 place-items-center rounded-full border border-sand/60 bg-cream/90 text-ink shadow-md backdrop-blur-xs transition hover:bg-olive hover:text-cream active:scale-90"
              >
                <NextIcon width={20} height={20} />
              </button>
            </>
          )}

          {/* Swipe hint on mobile */}
          {images.length > 1 && (
            <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center sm:hidden">
              <span className="rounded-full bg-ink/60 px-3 py-1 text-[11px] text-cream backdrop-blur-xs">
                {t('quick.swipeHint')}
              </span>
            </div>
          )}
        </div>

        {/* Thumbnails Strip */}
        {images.length > 1 && (
          <div className="no-scrollbar mt-2 sm:mt-3 flex items-center gap-1.5 sm:gap-2.5 overflow-x-auto pb-0.5 sm:pb-1">
            {images.map((imgUrl, idx) => {
              const isSelected = idx === activeIdx
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveIdx(idx)}
                  aria-label={t('quick.thumb', { n: idx + 1 })}
                  className={`relative size-10 sm:size-16 shrink-0 overflow-hidden rounded-lg sm:rounded-xl border transition-all active:scale-95 ${
                    isSelected
                      ? 'border-olive ring-2 ring-olive/30 scale-[1.03]'
                      : 'border-sand opacity-65 hover:opacity-100'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`${title} ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="flex flex-col justify-between p-4 sm:p-7 md:overflow-y-auto">
        <div className="pb-4">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {product.isBestSeller && (
              <span className="rounded-md bg-olive px-2.5 py-1 text-xs font-bold text-cream">
                {t('product.bestSellerBadge')}
              </span>
            )}
            {categoryName && (
              <span className="rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold text-olive">
                {categoryName}
              </span>
            )}
            {subcategoryName && (
              <span className="rounded-full bg-sand/80 px-3 py-1 text-xs font-medium text-ink">
                {subcategoryName}
              </span>
            )}
          </div>

          <h2 id="quick-view-title" className="mt-3 text-xl font-bold text-ink sm:text-2xl">
            {title}
          </h2>

          {secondaryName && secondaryName !== title && (
            <p className="mt-0.5 text-xs font-medium text-muted" dir={isRtl ? 'ltr' : 'rtl'}>
              {secondaryName}
            </p>
          )}

          <div className="mt-3 sm:mt-4 flex items-baseline gap-2 border-b border-sand pb-3 sm:pb-4">
            <span className="text-2xl font-bold text-olive">{formatPrice(product.price)}</span>
          </div>

          {/* Description */}
          <div className="mt-3 sm:mt-4">
            <h3 className="text-xs font-semibold text-muted">{t('quick.details')}</h3>
            <p className="mt-1.5 text-sm leading-7 text-ink/85">
              {description || t('quick.defaultDesc')}
            </p>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="sticky bottom-0 z-10 -mx-4 -mb-4 border-t border-sand bg-cream/95 p-4 backdrop-blur-md sm:static sm:mx-0 sm:mb-0 sm:border-t sm:bg-transparent sm:p-0 sm:pt-5 sm:backdrop-blur-none">
          <div className="flex items-center gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center rounded-full border border-sand-dark bg-white px-2 py-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label={t('quick.decrease')}
                className="grid size-8 place-items-center rounded-full text-base font-bold text-ink transition hover:bg-sand/60 active:scale-90"
              >
                −
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-ink">
                {formatNumber(quantity)}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                aria-label={t('quick.increase')}
                className="grid size-8 place-items-center rounded-full text-base font-bold text-ink transition hover:bg-sand/60 active:scale-90"
              >
                +
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              type="button"
              onClick={handleAddToCart}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold text-cream shadow-sm transition active:scale-[0.98] ${
                addedFeedback ? 'bg-emerald-700' : 'bg-olive hover:bg-olive-soft'
              }`}
            >
              <BagIcon width={18} height={18} />
              <span>{addedFeedback ? t('quick.added') : t('quick.add')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProductQuickViewModal({
  product,
  categoryName = '',
  subcategoryName = '',
  onAdd,
  onClose,
}) {
  useEffect(() => {
    if (!product) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [product, onClose])

  if (!product) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="fixed inset-0 bg-ink/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <QuickViewContent
        key={product.id}
        product={product}
        categoryName={categoryName}
        subcategoryName={subcategoryName}
        onAdd={onAdd}
        onClose={onClose}
      />
    </div>
  )
}
