import { useEffect, useState } from 'react'
import Logo from './Logo.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { BagIcon, CloseIcon, MenuIcon } from './Icons.jsx'
import { getCategories, getSubcategoriesByCategory } from '../services/catalogApi.js'
import { useAsync } from '../hooks/useAsync.js'
import { useLanguage } from '../i18n/useLanguage.js'

function DrawerSkeleton() {
  return (
    <ul aria-hidden="true" className="space-y-2 px-1">
      {[70, 55, 80, 60].map((w) => (
        <li key={w} className="h-11 animate-pulse rounded-xl bg-sand/60" style={{ width: `${w}%` }} />
      ))}
    </ul>
  )
}

function ErrorNote({ message, onRetry }) {
  const { t } = useLanguage()
  return (
    <div role="alert" className="rounded-xl bg-cream-deep px-4 py-3 text-sm text-ink">
      {message}
      <button type="button" onClick={onRetry} className="ms-2 font-semibold text-olive underline">
        {t('header.retry')}
      </button>
    </div>
  )
}

function CategoryAccordionItem({
  category,
  open,
  onToggle,
  onSelectCategory,
  onSelectSubcategory,
  focusable,
}) {
  const { t, pickName } = useLanguage()
  // Subcategories are fetched lazily the first time the item opens.
  const { data, loading, error, reload } = useAsync(
    () => getSubcategoriesByCategory(category.id),
    [category.id],
    open,
  )
  const panelId = `sub-${category.id}`
  const categoryName = pickName(category)

  return (
    <li>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        tabIndex={focusable ? 0 : -1}
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-start text-base font-medium text-ink transition hover:bg-sand/60"
      >
        {categoryName}
        <svg
          viewBox="0 0 24 24"
          className={`size-5 text-olive transition-transform duration-300 ease-calm ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div
        id={panelId}
        role="region"
        className={`grid transition-[grid-template-rows] duration-300 ease-calm ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
      >
        <div className="overflow-hidden" inert={!open}>
          <div className="me-4 mb-2 border-s border-sand ps-3">
            {loading && <DrawerSkeleton />}
            {error && <ErrorNote message={error.message} onRetry={reload} />}
            <ul>
              <li>
                <a
                  href={`#category-${category.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelectCategory?.(category.id)
                  }}
                  className="block rounded-lg px-3 py-2 text-xs font-bold text-olive transition hover:bg-sand/60"
                >
                  {t('header.viewAll', { name: categoryName })}
                </a>
              </li>
              {data?.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#category-${category.id}/subcategory-${s.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      onSelectSubcategory?.(category.id, s.id)
                    }}
                    className="block rounded-lg px-3 py-2.5 text-[0.95rem] text-ink/80 transition hover:bg-sand/60 hover:text-olive"
                  >
                    {pickName(s)}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </li>
  )
}

export default function Header({
  cartCount,
  onOpenCart,
  onSelectCategory,
  onSelectSubcategory,
  onNavigateHome,
  onNavigateSection,
}) {
  const { t, formatNumber } = useLanguage()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openCategoryId, setOpenCategoryId] = useState(null)
  const { data: categories, loading: catsLoading, error: catsError, reload: reloadCats } = useAsync(getCategories)

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setDrawerOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  const menuLinks = [
    { id: 'best-sellers', label: t('menu.bestSellers') },
    { id: 'b2b-section', label: t('menu.manufacturing') },
    { id: 'contact-footer', label: t('menu.contact') },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-sand bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-1 px-3 py-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:px-8">
          {/* Start side (right in Arabic, left in English): categories menu */}
          <div className="flex justify-start">
            <button
              id="open-menu"
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label={t('header.menuAria')}
              aria-expanded={drawerOpen}
              className="inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold text-olive transition active:scale-95 hover:bg-sand/60 sm:gap-2 sm:px-3.5"
            >
              <MenuIcon />
              <span>{t('header.menu')}</span>
            </button>
          </div>

          <div onClick={onNavigateHome} className="cursor-pointer">
            <Logo hideTaglineOnMobile />
          </div>

          {/* End side: language toggle + cart */}
          <div className="flex items-center justify-end gap-1 sm:gap-2">
            <LanguageToggle />
            <button
              id="open-cart"
              type="button"
              onClick={onOpenCart}
              aria-label={t('header.cartAria', { n: formatNumber(cartCount) })}
              className="relative inline-flex items-center gap-1.5 rounded-full px-2 py-2 text-sm font-semibold text-olive transition active:scale-95 hover:bg-sand/60 sm:gap-2 sm:px-3.5"
            >
              <span className="relative">
                <BagIcon />
                {cartCount > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid min-w-[1.1rem] place-items-center rounded-full bg-olive px-1 text-[0.65rem] font-medium leading-[1.1rem] text-cream">
                    {formatNumber(cartCount)}
                  </span>
                )}
              </span>
              <span>{t('header.cart')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Slide-over drawer (slides in from the start side so it mirrors with the language) */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        aria-hidden={!drawerOpen}
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label={t('header.closeMenu')}
          onClick={() => setDrawerOpen(false)}
          className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]"
        />
        <nav
          aria-label={t('header.menu')}
          className={`absolute inset-y-0 start-0 flex w-[82%] max-w-sm flex-col bg-cream shadow-2xl transition-transform duration-300 ease-calm ${
            drawerOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-sand px-5 py-4">
            <div
              onClick={() => {
                setDrawerOpen(false)
                onNavigateHome?.()
              }}
              className="cursor-pointer"
            >
              <Logo />
            </div>
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label={t('header.close')}
              className="grid size-10 place-items-center rounded-full text-olive hover:bg-sand/60"
            >
              <CloseIcon />
            </button>
          </div>
          <ul className="flex-1 overflow-y-auto px-3 py-4">
            {catsLoading && (
              <li>
                <DrawerSkeleton />
              </li>
            )}
            {catsError && (
              <li>
                <ErrorNote message={catsError.message} onRetry={reloadCats} />
              </li>
            )}
            {categories?.map((c) => (
              <CategoryAccordionItem
                key={c.id}
                category={c}
                open={openCategoryId === c.id}
                focusable={drawerOpen}
                onToggle={() => setOpenCategoryId((id) => (id === c.id ? null : c.id))}
                onSelectCategory={(catId) => {
                  setDrawerOpen(false)
                  onSelectCategory?.(catId)
                }}
                onSelectSubcategory={(catId, subId) => {
                  setDrawerOpen(false)
                  onSelectSubcategory?.(catId, subId)
                }}
              />
            ))}
            {menuLinks.map(({ id, label }) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  tabIndex={drawerOpen ? 0 : -1}
                  onClick={(e) => {
                    e.preventDefault()
                    setDrawerOpen(false)
                    onNavigateSection?.(id)
                  }}
                  className="block rounded-xl px-4 py-3.5 text-base font-medium text-ink transition hover:bg-sand/60"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  )
}
