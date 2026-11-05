import { useCallback, useEffect, useMemo, useState } from 'react'
import Header from './components/Header.jsx'
import Hero from './components/Hero.jsx'
import Categories from './components/Categories.jsx'
import B2BBanner from './components/B2BBanner.jsx'
import BestSellers from './components/BestSellers.jsx'
import CategoryProductsView from './components/CategoryProductsView.jsx'
import CartDrawer from './components/CartDrawer.jsx'
import { Footer, BottomNav } from './components/Footer.jsx'
import AdminDashboard from './components/admin/AdminDashboard.jsx'
import { useLanguage } from './i18n/useLanguage.js'

const CART_STORAGE_KEY = 'decency_cart_v1'

function loadCartFromStorage() {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const parseRouteFromLocation = () => {
  if (typeof window === 'undefined') {
    return { isAdmin: false, categoryId: null, subcategoryId: null }
  }
  const { pathname, hash } = window.location
  const isAdmin =
    pathname.startsWith('/admin') || hash === '#admin' || hash.startsWith('#/admin')

  if (isAdmin) {
    return { isAdmin: true, categoryId: null, subcategoryId: null }
  }

  // Match #category-<catId>/subcategory-<subId> or #category-<catId>
  const catSubMatch = hash.match(/^#category-([^/]+)\/subcategory-(.+)$/)
  if (catSubMatch) {
    return {
      isAdmin: false,
      categoryId: decodeURIComponent(catSubMatch[1]),
      subcategoryId: decodeURIComponent(catSubMatch[2]),
    }
  }

  const catMatch = hash.match(/^#category-(.+)$/)
  if (catMatch) {
    return {
      isAdmin: false,
      categoryId: decodeURIComponent(catMatch[1]),
      subcategoryId: null,
    }
  }

  return { isAdmin: false, categoryId: null, subcategoryId: null }
}

export default function App() {
  const { t, formatNumber, pickName } = useLanguage()
  const [route, setRoute] = useState(parseRouteFromLocation)
  const [cartItems, setCartItems] = useState(loadCartFromStorage)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartNotice, setCartNotice] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    } catch {
      // ignore storage errors
    }
  }, [cartItems])

  useEffect(() => {
    const handleLocationChange = () => {
      setRoute(parseRouteFromLocation())
    }

    window.addEventListener('popstate', handleLocationChange)
    window.addEventListener('hashchange', handleLocationChange)

    return () => {
      window.removeEventListener('popstate', handleLocationChange)
      window.removeEventListener('hashchange', handleLocationChange)
    }
  }, [])

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems],
  )

  const handleAddToCart = useCallback((product, qty = 1) => {
    if (!product || !product.id) return
    const addQty = Math.max(1, Number(qty) || 1)
    const image =
      product.imageUrl ||
      product.image ||
      (Array.isArray(product.images) && product.images[0]) ||
      '/images/cat-isdal.jpg'

    setCartItems((prev) => {
      const idx = prev.findIndex((item) => item.id === product.id)
      if (idx !== -1) {
        return prev.map((item, i) =>
          i === idx ? { ...item, quantity: item.quantity + addQty } : item,
        )
      }
      return [
        ...prev,
        {
          id: product.id,
          // Both languages are kept so the cart re-translates when the language is toggled.
          title: product.title || product.nameAr || product.nameEn || '',
          nameAr: product.nameAr || product.title || '',
          nameEn: product.nameEn || '',
          price: Number(product.price) || 0,
          image,
          quantity: addQty,
        },
      ]
    })

    setCartNotice({
      title: product.title || '',
      nameAr: product.nameAr || '',
      nameEn: product.nameEn || '',
    })
  }, [])

  useEffect(() => {
    if (!cartNotice) return
    const timer = setTimeout(() => setCartNotice(null), 3200)
    return () => clearTimeout(timer)
  }, [cartNotice])

  const handleUpdateQuantity = useCallback((productId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId))
      return
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity: newQuantity } : item,
      ),
    )
  }, [])

  const handleRemoveFromCart = useCallback((productId) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId))
  }, [])

  const handleClearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const navigateToStoreHome = () => {
    window.history.pushState({}, '', '/')
    setRoute({ isAdmin: false, categoryId: null, subcategoryId: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const navigateToSection = (sectionId) => {
    if (sectionId === 'contact-footer') {
      setTimeout(() => {
        document.getElementById('contact-footer')?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
      return
    }
    window.history.pushState({}, '', `/#${sectionId}`)
    setRoute({ isAdmin: false, categoryId: null, subcategoryId: null })
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
    }, 60)
  }

  const navigateToBestSellers = () => {
    navigateToSection('best-sellers')
  }

  const handleSelectCategory = (categoryId) => {
    if (!categoryId) {
      navigateToStoreHome()
      return
    }
    window.history.pushState({}, '', `/#category-${encodeURIComponent(categoryId)}`)
    setRoute({ isAdmin: false, categoryId, subcategoryId: null })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSelectSubcategory = (categoryId, subcategoryId) => {
    if (!subcategoryId) {
      handleSelectCategory(categoryId)
      return
    }
    window.history.pushState(
      {},
      '',
      `/#category-${encodeURIComponent(categoryId)}/subcategory-${encodeURIComponent(subcategoryId)}`,
    )
    setRoute({ isAdmin: false, categoryId, subcategoryId })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (route.isAdmin) {
    return <AdminDashboard onNavigateToStore={navigateToStoreHome} />
  }

  return (
    <>
      <Header
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onSelectCategory={handleSelectCategory}
        onSelectSubcategory={handleSelectSubcategory}
        onNavigateHome={navigateToStoreHome}
        onNavigateSection={navigateToSection}
      />
      <main>
        {route.categoryId ? (
          <CategoryProductsView
            categoryId={route.categoryId}
            initialSubcategoryId={route.subcategoryId}
            onSelectCategory={handleSelectCategory}
            onSelectSubcategory={(subId) => handleSelectSubcategory(route.categoryId, subId)}
            onBackToHome={navigateToStoreHome}
            onAdd={handleAddToCart}
          />
        ) : (
          <>
            <Hero />
            <Categories onSelectCategory={handleSelectCategory} />
            <B2BBanner />
            <BestSellers onAdd={handleAddToCart} />
          </>
        )}
      </main>
      <Footer />
      <BottomNav
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        onNavigateHome={navigateToStoreHome}
        onNavigateBestSellers={navigateToBestSellers}
      />

      {/* Slide-over Cart & Checkout Drawer */}
      <CartDrawer
        open={cartOpen}
        items={cartItems}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
      />

      {/* Floating Added-to-Cart Notification Bar */}
      {cartNotice && !cartOpen && (
        <div className="fixed inset-x-4 bottom-20 z-40 mx-auto flex max-w-md items-center justify-between gap-3 rounded-2xl border border-olive/30 bg-ink/95 px-4 py-3 text-cream shadow-xl backdrop-blur-md md:bottom-6">
          <div className="min-w-0 text-xs">
            <span className="font-semibold text-emerald-400">{t('app.added')}</span>
            <span className="truncate font-medium">{pickName(cartNotice)}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setCartNotice(null)
              setCartOpen(true)
            }}
            className="shrink-0 rounded-full bg-olive px-3.5 py-1.5 text-xs font-bold text-cream transition hover:bg-olive-soft"
          >
            {t('app.viewCart', { n: formatNumber(cartCount) })}
          </button>
        </div>
      )}
    </>
  )
}
