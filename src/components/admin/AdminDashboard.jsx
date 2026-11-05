import { useCallback, useEffect, useState } from 'react'
import Logo from '../Logo.jsx'
import {
  ChevronDownIcon,
  CloseIcon,
  LayersIcon,
  LogOutIcon,
  MenuIcon,
  PackageIcon,
  StoreIcon,
  TagIcon,
} from './AdminIcons.jsx'
import CategoryManager from './CategoryManager.jsx'
import SubcategoryManager from './SubcategoryManager.jsx'
import ProductManager from './ProductManager.jsx'
import AdminToast from './AdminToast.jsx'
import AdminLogin from './AdminLogin.jsx'
import {
  API_BASE_URL,
  clearAdminAuthSession,
  getCategories,
  getProducts,
  getSubcategories,
  hasValidAdminSession,
} from '../../services/catalogApi.js'
import { getStoreWhatsappPhone } from '../../data/products.js'

export default function AdminDashboard({ onNavigateToStore }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidAdminSession)
  const [authNotice, setAuthNotice] = useState('')
  const [activeTab, setActiveTab] = useState('categories') // 'categories' | 'subcategories' | 'products'
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toasts, setToasts] = useState([])
  const [whatsappPhone, setWhatsappPhone] = useState(getStoreWhatsappPhone)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [mobileWidgetsOpen, setMobileWidgetsOpen] = useState(false)

  const addToast = useCallback(({ type = 'success', title, message }) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6)
    setToasts((prev) => [...prev, { id, type, title, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const [refreshTick, setRefreshTick] = useState(0)

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  useEffect(() => {
    const handleUnauthorized = () => {
      setDrawerOpen(false)
      setAuthNotice('انتهت صلاحية جلسة الدخول. يرجى إدخال كلمة المرور مرة أخرى.')
      setIsAuthenticated(false)
    }
    window.addEventListener('decency-admin-unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('decency-admin-unauthorized', handleUnauthorized)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    let alive = true
    const force = refreshTick > 0
    Promise.all([
      getCategories(force),
      getSubcategories(force),
      getProducts(force),
    ])
      .then(([cats, subs, prods]) => {
        if (!alive) return
        setCategories(cats)
        setSubcategories(subs)
        setProducts(prods)
        setLoading(false)
      })
      .catch((err) => {
        if (!alive) return
        setLoading(false)
        addToast({
          type: 'error',
          title: 'خطأ في تحميل البيانات',
          message: err.message || 'تعذر الاتصال بالخادم لجلب البيانات.',
        })
      })
    return () => {
      alive = false
    }
  }, [addToast, isAuthenticated, refreshTick])

  useEffect(() => {
    if (!drawerOpen) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prevOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen])

  const handleRefresh = useCallback(() => {
    setLoading(true)
    setRefreshTick((t) => t + 1)
  }, [])

  const handleSelectTab = (tabId) => {
    setActiveTab(tabId)
    setDrawerOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSaveWhatsappPhone = () => {
    const cleaned = whatsappPhone.replace(/\D/g, '')
    if (!cleaned) return
    const normalized = cleaned.startsWith('01') ? `2${cleaned}` : cleaned
    setWhatsappPhone(normalized)
    localStorage.setItem('decency_whatsapp_phone', normalized)
    addToast({
      type: 'success',
      title: 'تم حفظ الرقم',
      message: `سيتم إرسال طلبات السلة إلى الرقم ${normalized}`,
    })
  }

  const handleLogout = () => {
    clearAdminAuthSession()
    setDrawerOpen(false)
    setAuthNotice('')
    setIsAuthenticated(false)
  }

  if (!isAuthenticated) {
    return (
      <AdminLogin
        initialMessage={authNotice}
        onNavigateToStore={onNavigateToStore}
        onSuccess={() => {
          setAuthNotice('')
          setIsAuthenticated(true)
        }}
      />
    )
  }

  const navItems = [
    {
      id: 'categories',
      label: 'الأقسام الرئيسية',
      shortLabel: 'الأقسام الرئيسية',
      count: categories.length,
      Icon: LayersIcon,
    },
    {
      id: 'subcategories',
      label: 'الأقسام الفرعية',
      shortLabel: 'الأقسام الفرعية',
      count: subcategories.length,
      Icon: TagIcon,
    },
    {
      id: 'products',
      label: 'المنتجات',
      shortLabel: 'المنتجات',
      count: products.length,
      Icon: PackageIcon,
    },
  ]

  const renderNavigationList = () => (
    <nav aria-label="أقسام لوحة التحكم" className="p-4 space-y-1.5">
      {navItems.map(({ id, label, count, Icon }) => {
        const isActive = activeTab === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => handleSelectTab(id)}
            className={`flex min-h-12 w-full items-center justify-between rounded-2xl px-4 py-3.5 text-start text-sm font-semibold transition active:scale-[0.99] ${
              isActive
                ? 'bg-olive text-cream shadow-sm'
                : 'text-ink/80 hover:bg-sand/60 hover:text-ink'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon width={20} height={20} />
              <span>{label}</span>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                isActive ? 'bg-white/20 text-cream' : 'bg-sand/70 text-ink'
              }`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </nav>
  )

  const renderFooterWidgets = (inputIdPrefix = 'admin-wa-phone') => (
    <div className="space-y-3">
      {/* WhatsApp Orders Phone Setting */}
      <div className="rounded-xl border border-sand bg-white/70 p-3.5 text-xs">
        <label htmlFor={inputIdPrefix} className="block font-semibold text-ink">
          رقم واتساب لاستقبال الطلبات:
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            id={inputIdPrefix}
            type="tel"
            dir="ltr"
            value={whatsappPhone}
            onChange={(e) => setWhatsappPhone(e.target.value)}
            placeholder="201012345678"
            className="min-h-11 w-full rounded-xl border border-sand bg-white px-3 py-2 text-left font-mono text-xs text-ink outline-none transition focus:border-olive"
          />
          <button
            type="button"
            onClick={handleSaveWhatsappPhone}
            className="min-h-11 shrink-0 rounded-xl bg-olive px-4 py-2 text-xs font-semibold text-cream transition hover:bg-olive-soft active:scale-95"
          >
            حفظ
          </button>
        </div>
      </div>

      {/* API Status Indicator */}
      <div className="rounded-xl border border-sand bg-white/60 p-3.5 text-xs">
        <div className="flex items-center justify-between text-muted">
          <span>خادم البيانات (API):</span>
          <span className="flex items-center gap-1.5 font-medium text-emerald-700">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            متصل
          </span>
        </div>
        <p
          className="mt-1.5 truncate font-mono text-[11px] text-ink/70"
          dir="ltr"
          title={API_BASE_URL}
        >
          {API_BASE_URL}
        </p>
      </div>
    </div>
  )

  return (
    <div dir="rtl" className="min-h-screen bg-cream text-ink flex flex-col lg:flex-row">
      {/* Mobile / Tablet Top Sticky Header (< lg) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-sand bg-cream/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="فتح قائمة لوحة التحكم"
            aria-expanded={drawerOpen}
            className="grid size-11 place-items-center rounded-xl border border-sand bg-white/80 text-ink transition hover:bg-sand/60 active:scale-95"
          >
            <MenuIcon width={20} height={20} />
          </button>
          <div className="flex flex-col">
            <Logo />
            <span className="text-[10px] font-semibold tracking-wider text-olive uppercase">
              لوحة التحكم الإدارية
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToStore}
          className="inline-flex min-h-11 items-center gap-1.5 rounded-xl border border-sand-dark bg-white/80 px-3.5 py-2 text-xs font-semibold text-ink transition hover:bg-sand/60 active:scale-95"
        >
          <StoreIcon width={16} height={16} />
          <span>المتجر</span>
        </button>
      </header>

      {/* Mobile / Tablet Slide-Over Sidebar Drawer (< lg) */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition ${
          drawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
        }`}
        aria-hidden={!drawerOpen}
      >
        {/* Backdrop */}
        <div
          onClick={() => setDrawerOpen(false)}
          className={`fixed inset-0 bg-ink/45 backdrop-blur-xs transition-opacity duration-300 ${
            drawerOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer Panel (RTL right side) */}
        <aside
          aria-label="قائمة لوحة التحكم"
          className={`fixed inset-y-0 start-0 flex w-80 max-w-[86vw] flex-col justify-between border-e border-sand bg-cream shadow-2xl transition-transform duration-300 ease-out ${
            drawerOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="overflow-y-auto">
            <div className="flex items-center justify-between border-b border-sand/80 px-5 py-4">
              <div className="flex flex-col">
                <Logo />
                <span className="mt-1 text-[11px] font-semibold tracking-wider text-olive uppercase">
                  لوحة التحكم الإدارية
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
                className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-sand/60 hover:text-ink active:scale-95"
              >
                <CloseIcon width={20} height={20} />
              </button>
            </div>

            {renderNavigationList()}
          </div>

          <div className="border-t border-sand/80 bg-cream-deep/40 p-4 space-y-2.5">
            {renderFooterWidgets('drawer-wa-phone')}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onNavigateToStore}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sand-dark bg-white/80 px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sand/60 active:scale-95"
              >
                <StoreIcon width={16} height={16} />
                <span>المتجر</span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
              >
                <LogOutIcon width={16} height={16} />
                <span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Desktop Right-Hand Sidebar (lg and up) */}
      <aside className="hidden lg:flex lg:w-72 lg:shrink-0 lg:flex-col lg:justify-between lg:border-e lg:border-sand lg:bg-cream-deep/60 lg:sticky lg:top-0 lg:h-screen">
        <div>
          {/* Logo and Brand Title */}
          <div className="flex items-center justify-between border-b border-sand/80 px-6 py-5">
            <div className="flex flex-col">
              <Logo />
              <span className="mt-1 text-[11px] font-semibold tracking-wider text-olive uppercase">
                لوحة التحكم الإدارية
              </span>
            </div>
          </div>

          {/* Navigation Tabs */}
          {renderNavigationList()}
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-sand/80 p-4 space-y-2.5">
          {renderFooterWidgets('desktop-wa-phone')}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onNavigateToStore}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-sand-dark bg-white/70 px-3 py-2.5 text-xs font-semibold text-ink transition hover:bg-sand/60 active:scale-95"
            >
              <StoreIcon width={16} height={16} />
              <span>المتجر</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3 py-2.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 active:scale-95"
            >
              <LogOutIcon width={16} height={16} />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-4 pt-5 pb-28 sm:px-8 sm:pt-8 lg:p-10">
        <div className="mx-auto max-w-6xl space-y-8">
          {activeTab === 'categories' ? (
            <CategoryManager
              categories={categories}
              subcategories={subcategories}
              loading={loading}
              onRefresh={handleRefresh}
              addToast={addToast}
            />
          ) : activeTab === 'subcategories' ? (
            <SubcategoryManager
              categories={categories}
              subcategories={subcategories}
              loading={loading}
              onRefresh={handleRefresh}
              addToast={addToast}
            />
          ) : (
            <ProductManager
              products={products}
              categories={categories}
              subcategories={subcategories}
              loading={loading}
              onRefresh={handleRefresh}
              addToast={addToast}
            />
          )}

          {/* Mobile / Tablet End-of-Page Collapsible Settings & API Status (< lg) */}
          <section className="lg:hidden rounded-2xl border border-sand bg-cream-deep/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setMobileWidgetsOpen((v) => !v)}
              aria-expanded={mobileWidgetsOpen}
              className="flex min-h-12 w-full items-center justify-between px-4 py-3.5 text-start text-sm font-semibold text-ink transition hover:bg-sand/40"
            >
              <div className="flex items-center gap-2.5">
                <span className="size-2.5 rounded-full bg-emerald-500" />
                <span>إعدادات واتساب وحالة الخادم (API)</span>
              </div>
              <ChevronDownIcon
                width={18}
                height={18}
                className={`text-muted transition-transform duration-200 ${
                  mobileWidgetsOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {mobileWidgetsOpen && (
              <div className="border-t border-sand/80 p-4">
                {renderFooterWidgets('mobile-footer-wa-phone')}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile / Tablet Bottom Navigation Bar (< lg) */}
      <nav
        aria-label="التنقل السريع للوحة التحكم"
        className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-sand bg-cream/95 px-2 py-1.5 backdrop-blur-md shadow-lg lg:hidden"
      >
        {navItems.map(({ id, shortLabel, count, Icon }) => {
          const isActive = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelectTab(id)}
              className={`relative flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl px-2 py-1.5 text-xs font-semibold transition active:scale-95 ${
                isActive
                  ? 'bg-olive/12 text-olive'
                  : 'text-muted hover:text-ink'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <Icon width={19} height={19} />
                <span
                  className={`-top-1.5 -end-5 absolute rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight ${
                    isActive
                      ? 'bg-olive text-cream'
                      : 'bg-sand text-ink/80'
                  }`}
                >
                  {count}
                </span>
              </div>
              <span className="truncate max-w-full">{shortLabel}</span>
            </button>
          )
        })}
      </nav>

      {/* Toast Feedback */}
      <AdminToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
