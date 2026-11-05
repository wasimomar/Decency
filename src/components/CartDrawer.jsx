import { useEffect, useMemo, useState } from 'react'
import { formatPrice as formatPriceFor, getStoreWhatsappPhone } from '../data/products.js'
import { GOVERNORATES } from '../i18n/translations.js'
import { useLanguage } from '../i18n/useLanguage.js'
import { BagIcon, CloseIcon, WhatsappIcon } from './Icons.jsx'

const CUSTOMER_STORAGE_KEY = 'decency_customer_v1'
const DEFAULT_GOVERNORATE = 'القاهرة'

function loadSavedCustomer() {
  try {
    const raw = localStorage.getItem(CUSTOMER_STORAGE_KEY)
    if (!raw) return { name: '', phone: '', governorate: DEFAULT_GOVERNORATE, address: '', notes: '' }
    const parsed = JSON.parse(raw)
    return {
      name: parsed.name || '',
      phone: parsed.phone || '',
      governorate: parsed.governorate || DEFAULT_GOVERNORATE,
      address: parsed.address || '',
      notes: '',
    }
  } catch {
    return { name: '', phone: '', governorate: DEFAULT_GOVERNORATE, address: '', notes: '' }
  }
}

const TrashSmallIcon = (p) => (
  <svg
    width={16}
    height={16}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...p}
  >
    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
)

export default function CartDrawer({
  open,
  items = [],
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) {
  const { lang, t, formatNumber, formatPrice, pickName } = useLanguage()
  const [step, setStep] = useState('cart') // 'cart' | 'checkout' | 'success'
  const [customer, setCustomer] = useState(loadSavedCustomer)
  const [formError, setFormError] = useState('')
  const [lastWhatsappUrl, setLastWhatsappUrl] = useState('')

  useEffect(() => {
    if (!open) return
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
  }, [open, onClose])

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  )

  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  )

  const handleClose = () => {
    onClose?.()
    setTimeout(() => {
      setStep('cart')
      setFormError('')
    }, 250)
  }

  const handleFieldChange = (field, value) => {
    setCustomer((prev) => ({ ...prev, [field]: value }))
    if (formError) setFormError('')
  }

  const handleCheckoutSubmit = (e) => {
    e.preventDefault()
    const name = customer.name.trim()
    const phone = customer.phone.trim()
    const governorate = customer.governorate.trim()
    const address = customer.address.trim()
    const notes = customer.notes.trim()

    if (!name) {
      setFormError(t('cart.errName'))
      return
    }
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setFormError(t('cart.errPhone'))
      return
    }
    if (!address) {
      setFormError(t('cart.errAddress'))
      return
    }
    if (items.length === 0) {
      setFormError(t('cart.errEmpty'))
      return
    }

    // Persist customer contact details for convenience next time
    try {
      localStorage.setItem(
        CUSTOMER_STORAGE_KEY,
        JSON.stringify({ name, phone, governorate, address }),
      )
    } catch {
      // ignore storage errors
    }

    // The order message is always written in Arabic (the store team's working language),
    // regardless of the language the customer is browsing in.
    const lines = [
      '🛍️ *طلب جديد من متجر DECENCY*',
      '━━━━━━━━━━━━━━━━━━',
      '👤 *بيانات العميل:*',
      `• الاسم: ${name}`,
      `• رقم الهاتف: ${phone}`,
      `• المحافظة: ${governorate}`,
      `• العنوان: ${address}`,
    ]

    if (notes) {
      lines.push(`• ملاحظات: ${notes}`)
    }

    lines.push('━━━━━━━━━━━━━━━━━━')
    lines.push('📦 *المنتجات المطلوبة:*')

    items.forEach((item, idx) => {
      const subtotal = item.price * item.quantity
      const arabicName = item.nameAr || item.title || item.nameEn || ''
      lines.push(
        `${idx + 1}. *${arabicName}*\n   الكمية: ${item.quantity} × ${formatPriceFor(item.price, 'ar')} = *${formatPriceFor(subtotal, 'ar')}*`,
      )
    })

    lines.push('━━━━━━━━━━━━━━━━━━')
    lines.push(`🔢 إجمالي عدد القطع: *${totalCount} قطعة*`)
    lines.push(`💰 *الإجمالي الكلي: ${formatPriceFor(totalPrice, 'ar')}*`)
    lines.push('━━━━━━━━━━━━━━━━━━')
    lines.push('يرجى تأكيد استلام الطلب 🌸')

    const messageText = lines.join('\n')
    const storePhone = getStoreWhatsappPhone()
    const waUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(messageText)}`

    setLastWhatsappUrl(waUrl)
    window.open(waUrl, '_blank', 'noopener,noreferrer')
    onClearCart?.()
    setStep('success')
  }

  const headerTitle =
    step === 'checkout'
      ? t('cart.checkoutTitle')
      : step === 'success'
        ? t('cart.successTitle')
        : t('cart.title')

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${
        open ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        tabIndex={-1}
        aria-label={t('cart.closeAria')}
        onClick={handleClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-xs"
      />

      {/* Slide-over panel: opens from the end side (under the cart button) in both languages */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('cart.aria')}
        className={`absolute inset-y-0 end-0 flex w-full max-w-md flex-col bg-cream shadow-2xl transition-transform duration-300 ease-calm ${
          open ? 'translate-x-0' : 'ltr:translate-x-full rtl:-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-sand px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-full bg-olive/10 text-olive">
              <BagIcon width={18} height={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-ink">{headerTitle}</h2>
              {step === 'cart' && (
                <p className="text-xs text-muted">
                  {totalCount > 0
                    ? t('cart.count', { n: formatNumber(totalCount) })
                    : t('cart.emptyHint')}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {step === 'cart' && items.length > 0 && (
              <button
                type="button"
                onClick={onClearCart}
                className="rounded-full px-3 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                {t('cart.clear')}
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              aria-label={t('header.close')}
              className="grid size-9 place-items-center rounded-full text-olive transition hover:bg-sand/60"
            >
              <CloseIcon width={18} height={18} />
            </button>
          </div>
        </div>

        {/* STEP 1: CART ITEMS LIST */}
        {step === 'cart' && (
          <>
            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
                <div className="grid size-20 place-items-center rounded-full bg-cream-deep text-olive/60">
                  <BagIcon width={36} height={36} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-ink">{t('cart.emptyTitle')}</h3>
                <p className="mt-1.5 max-w-xs text-xs leading-6 text-muted">
                  {t('cart.emptyText')}
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="mt-6 rounded-full bg-olive px-7 py-3 text-sm font-semibold text-cream shadow-xs transition hover:bg-olive-soft active:scale-95"
                >
                  {t('cart.browse')}
                </button>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-sand/80 overflow-y-auto px-5 py-3">
                  {items.map((item) => {
                    const itemSubtotal = item.price * item.quantity
                    const itemName = pickName(item)
                    return (
                      <li key={item.id} className="flex gap-3.5 py-4">
                        <div className="size-20 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                          <img
                            src={item.image}
                            alt={itemName}
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              if (e.currentTarget.src !== '/images/cat-isdal.jpg') {
                                e.currentTarget.src = '/images/cat-isdal.jpg'
                              }
                            }}
                            className="size-full object-cover"
                          />
                        </div>

                        <div className="flex flex-1 flex-col justify-between min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-bold text-ink">
                                {itemName}
                              </h3>
                              <p className="mt-0.5 text-xs text-muted">
                                {t('cart.unitPrice', { p: formatPrice(item.price) })}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem?.(item.id)}
                              aria-label={t('cart.removeAria', { name: itemName })}
                              className="grid size-7 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600"
                              title={t('cart.removeTitle')}
                            >
                              <TrashSmallIcon />
                            </button>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            {/* Quantity controls */}
                            <div className="inline-flex items-center rounded-full border border-sand-dark bg-white px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity?.(item.id, item.quantity - 1)
                                }
                                aria-label={t('quick.decrease')}
                                className="grid size-6 place-items-center rounded-full text-sm font-bold text-ink transition hover:bg-sand/60 active:scale-90"
                              >
                                −
                              </button>
                              <span className="min-w-[1.75rem] text-center text-xs font-bold text-ink">
                                {formatNumber(item.quantity)}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity?.(item.id, item.quantity + 1)
                                }
                                aria-label={t('quick.increase')}
                                className="grid size-6 place-items-center rounded-full text-sm font-bold text-ink transition hover:bg-sand/60 active:scale-90"
                              >
                                +
                              </button>
                            </div>

                            {/* Item Subtotal */}
                            <span className="text-sm font-bold text-olive">
                              {formatPrice(itemSubtotal)}
                            </span>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                {/* Cart Footer */}
                <div className="border-t border-sand bg-cream-deep/70 p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span>{t('cart.piecesCount')}</span>
                      <span>{t('cart.piecesUnit', { n: formatNumber(totalCount) })}</span>
                    </div>
                    <div className="flex items-center justify-between text-base font-bold text-ink">
                      <span>{t('cart.grandTotal')}</span>
                      <span className="text-lg text-olive">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep('checkout')}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-olive py-3.5 text-sm font-semibold text-cream shadow-sm transition hover:bg-olive-soft active:scale-[0.98]"
                  >
                    <span>{t('cart.continue')}</span>
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {/* STEP 2: CUSTOMER CHECKOUT FORM */}
        {step === 'checkout' && (
          <form onSubmit={handleCheckoutSubmit} className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* Back to cart button */}
              <button
                type="button"
                onClick={() => {
                  setStep('cart')
                  setFormError('')
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-olive transition hover:underline"
              >
                <span>{t('cart.backToCart')}</span>
              </button>

              {/* Order Summary Pill */}
              <div className="rounded-2xl border border-sand bg-cream-deep p-3.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{t('cart.summary', { n: formatNumber(totalCount) })}</span>
                  <span className="text-sm font-bold text-olive">{formatPrice(totalPrice)}</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {items.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-lg bg-white/80 px-2.5 py-1 text-[11px] font-medium text-ink border border-sand/60"
                    >
                      {pickName(item)} × {formatNumber(item.quantity)}
                    </span>
                  ))}
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  {formError}
                </div>
              )}

              <div>
                <label htmlFor="cust-name" className="block text-xs font-semibold text-ink">
                  {t('cart.name')} <span className="text-red-600">*</span>
                </label>
                <input
                  id="cust-name"
                  type="text"
                  required
                  value={customer.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  placeholder={t('cart.namePh')}
                  className="mt-1.5 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="cust-phone" className="block text-xs font-semibold text-ink">
                    {t('cart.phone')} <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="cust-phone"
                    type="tel"
                    dir="ltr"
                    required
                    value={customer.phone}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    placeholder="01012345678"
                    className="mt-1.5 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-left text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive"
                  />
                </div>

                <div>
                  <label htmlFor="cust-gov" className="block text-xs font-semibold text-ink">
                    {t('cart.governorate')} <span className="text-red-600">*</span>
                  </label>
                  <select
                    id="cust-gov"
                    value={customer.governorate}
                    onChange={(e) => handleFieldChange('governorate', e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-sand bg-white px-3.5 py-2.5 text-sm text-ink outline-none transition focus:border-olive focus:ring-1 focus:ring-olive"
                  >
                    {GOVERNORATES.map((g) => (
                      <option key={g.ar} value={g.ar}>
                        {lang === 'en' ? g.en : g.ar}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cust-address" className="block text-xs font-semibold text-ink">
                  {t('cart.address')} <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="cust-address"
                  rows={2}
                  required
                  value={customer.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  placeholder={t('cart.addressPh')}
                  className="mt-1.5 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive"
                />
              </div>

              <div>
                <label htmlFor="cust-notes" className="block text-xs font-semibold text-ink">
                  {t('cart.notes')} <span className="font-normal text-muted">{t('cart.optional')}</span>
                </label>
                <textarea
                  id="cust-notes"
                  rows={2}
                  value={customer.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder={t('cart.notesPh')}
                  className="mt-1.5 w-full rounded-xl border border-sand bg-white px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive"
                />
              </div>
            </div>

            {/* Checkout Submit Footer */}
            <div className="border-t border-sand bg-cream-deep/70 p-5 space-y-3">
              <div className="flex items-center justify-between text-sm font-bold text-ink">
                <span>{t('cart.due')}</span>
                <span className="text-lg text-olive">{formatPrice(totalPrice)}</span>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2.5 rounded-full bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#1ebe5a] active:scale-[0.98]"
              >
                <WhatsappIcon width={20} height={20} />
                <span>{t('cart.submit')}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS VIEW */}
        {step === 'success' && (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="grid size-20 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <WhatsappIcon width={38} height={38} />
            </div>
            <h3 className="mt-4 text-xl font-bold text-ink">{t('cart.successHead')}</h3>
            <p className="mt-2 max-w-xs text-xs leading-6 text-muted">
              {t('cart.successText')}
            </p>

            {lastWhatsappUrl && (
              <a
                href={lastWhatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-xs transition hover:bg-[#1ebe5a]"
              >
                <WhatsappIcon width={18} height={18} />
                <span>{t('cart.reopen')}</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-3 rounded-full border border-sand-dark px-6 py-2.5 text-xs font-semibold text-ink transition hover:bg-sand/60"
            >
              {t('cart.continueShopping')}
            </button>
          </div>
        )}
      </aside>
    </div>
  )
}
