import { useMemo, useState } from 'react'
import {
  CopyIcon,
  EditIcon,
  FilterIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  Spinner,
  TrashIcon,
} from './AdminIcons.jsx'
import ProductModal from './ProductModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '../../services/catalogApi.js'
import { formatPrice } from '../../data/products.js'

export default function ProductManager({
  products = [],
  categories = [],
  subcategories = [],
  loading = false,
  onRefresh,
  addToast,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL')
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const categoryMap = useMemo(() => {
    const map = new Map()
    for (const c of categories) {
      map.set(c.id, c.title)
    }
    return map
  }, [categories])

  const subcategoryMap = useMemo(() => {
    const map = new Map()
    for (const s of subcategories) {
      map.set(s.id, s.title)
    }
    return map
  }, [subcategories])

  const availableSubcategories = useMemo(() => {
    if (selectedCategoryId === 'ALL') return subcategories
    return subcategories.filter((s) => s.categoryId === selectedCategoryId)
  }, [subcategories, selectedCategoryId])

  const handleCategoryFilterChange = (val) => {
    setSelectedCategoryId(val)
    setSelectedSubcategoryId('ALL')
  }

  const filteredProducts = useMemo(() => {
    let list = products

    if (selectedCategoryId !== 'ALL') {
      list = list.filter((p) => p.categoryId === selectedCategoryId)
    }

    if (selectedSubcategoryId !== 'ALL') {
      list = list.filter((p) => p.subcategoryId === selectedSubcategoryId)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((p) => {
        const catName = categoryMap.get(p.categoryId) || ''
        const subName = subcategoryMap.get(p.subcategoryId) || ''
        return (
          p.title?.toLowerCase().includes(q) ||
          p.nameEn?.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.descriptionEn?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q) ||
          subName.toLowerCase().includes(q)
        )
      })
    }

    return list
  }, [products, selectedCategoryId, selectedSubcategoryId, search, categoryMap, subcategoryMap])

  const handleOpenAdd = () => {
    setEditingProduct(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod)
    setModalOpen(true)
  }

  const handleOpenDelete = (prod) => {
    setProductToDelete(prod)
    setDeleteModalOpen(true)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload)
        addToast({
          type: 'success',
          title: 'تم التعديل بنجاح',
          message: `تم تحديث بيانات منتج "${payload.name.ar}" بنجاح.`,
        })
      } else {
        await createProduct(payload)
        addToast({
          type: 'success',
          title: 'تمت الإضافة بنجاح',
          message: `تمت إضافة منتج "${payload.name.ar}" إلى المتجر.`,
        })
      }
      setModalOpen(false)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'فشلت العملية',
        message: err.message || 'حدث خطأ أثناء حفظ المنتج.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      await deleteProduct(productToDelete.id)
      addToast({
        type: 'success',
        title: 'تم الحذف',
        message: `تم حذف منتج "${productToDelete.title}" بنجاح.`,
      })
      setDeleteModalOpen(false)
      setProductToDelete(null)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'تعذر الحذف',
        message: err.message || 'حدث خطأ أثناء حذف المنتج.',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleCopy = (text, label) => {
    navigator.clipboard?.writeText(text)
    addToast({
      type: 'info',
      title: 'تم النسخ',
      message: `تم نسخ ${label} (${text}) إلى الحافظة.`,
    })
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              إدارة المنتجات
            </h2>
            <span className="rounded-full bg-olive/10 px-3 py-0.5 text-xs font-semibold text-olive">
              {products.length} منتجات
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            عرض وإضافة وتعديل المنتجات وربطها بالأقسام الرئيسية والفرعية مع رفع الصور للمتجر.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-sand bg-cream-deep/60 px-3.5 py-2.5 text-sm font-medium text-ink transition hover:bg-sand/60 active:scale-95 disabled:opacity-50"
            title="تحديث البيانات"
          >
            <RefreshIcon spinning={loading} width={18} height={18} />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAdd}
            disabled={categories.length === 0}
            className="inline-flex min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-olive px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition hover:bg-olive-soft active:scale-95 disabled:opacity-50"
          >
            <PlusIcon width={18} height={18} />
            <span>إضافة منتج جديد</span>
          </button>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_220px_220px]">
        {/* Search Input */}
        <div className="relative sm:col-span-2 lg:col-span-1">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي عن منتج بالاسم، الوصف، أو القسم..."
            className="min-h-12 w-full rounded-2xl border border-sand bg-white/80 py-3 pe-14 ps-11 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute inset-y-0 end-0 flex min-w-11 items-center justify-center pe-3 text-xs font-medium text-muted hover:text-ink"
            >
              مسح
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
            <FilterIcon width={16} height={16} />
          </span>
          <select
            value={selectedCategoryId}
            onChange={(e) => handleCategoryFilterChange(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-2xl border border-sand bg-white/80 py-3 pe-8 ps-9 text-sm text-ink outline-none transition focus:border-olive"
          >
            <option value="ALL">كل الأقسام الرئيسية</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted">
            ▼
          </span>
        </div>

        {/* Subcategory Filter */}
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
            <FilterIcon width={16} height={16} />
          </span>
          <select
            value={selectedSubcategoryId}
            onChange={(e) => setSelectedSubcategoryId(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-2xl border border-sand bg-white/80 py-3 pe-8 ps-9 text-sm text-ink outline-none transition focus:border-olive"
          >
            <option value="ALL">كل الأقسام الفرعية</option>
            {availableSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center pe-3 text-muted">
            ▼
          </span>
        </div>
      </div>

      {/* Warning if no categories exist */}
      {categories.length === 0 && !loading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          ⚠️ لا توجد أقسام رئيسية مضافة بعد. يجب إضافة قسم رئيسي أولاً قبل إضافة منتجات.
        </div>
      )}

      {/* Main Content Area */}
      {loading && !products.length ? (
        <div className="rounded-2xl border border-sand bg-white/50 p-12 text-center">
          <Spinner className="mx-auto size-8 text-olive" />
          <p className="mt-3 text-sm text-muted">جاري تحميل المنتجات من الخادم...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="rounded-2xl border border-sand bg-white/40 p-10 sm:p-12 text-center">
          <p className="text-base font-semibold text-ink">لم يتم العثور على أي منتجات</p>
          <p className="mt-1 text-xs text-muted">
            {search || selectedCategoryId !== 'ALL' || selectedSubcategoryId !== 'ALL'
              ? 'جرّبي تغيير معايير البحث أو الفلترة.'
              : 'ابدئي بإضافة أول منتج إلى المتجر.'}
          </p>
          {categories.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-olive-soft"
            >
              <PlusIcon width={16} height={16} />
              <span>إضافة منتج الآن</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Stacked Cards View (< md) */}
          <div className="grid gap-3.5 md:hidden">
            {filteredProducts.map((prod) => {
              const catName = categoryMap.get(prod.categoryId) || 'غير محدد'
              const subName = prod.subcategoryId ? subcategoryMap.get(prod.subcategoryId) : null
              const imgCount = prod.images?.length || 0

              return (
                <article
                  key={prod.id}
                  className="rounded-2xl border border-sand bg-white/85 p-4 shadow-xs transition hover:border-olive/40"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Product Thumbnail */}
                    <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.title}
                          referrerPolicy="no-referrer"
                          className="size-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      ) : (
                        <div className="grid size-full place-items-center text-xs text-muted">
                          بدون
                        </div>
                      )}
                      {imgCount > 1 && (
                        <span className="absolute bottom-1 end-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                          +{imgCount - 1}
                        </span>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ink">{prod.title}</h3>
                        <span className="shrink-0 rounded-full bg-olive/10 px-2.5 py-1 text-xs font-bold text-olive">
                          {formatPrice(prod.price)}
                        </span>
                      </div>

                      {prod.nameEn && (
                        <p className="mt-0.5 truncate text-xs font-medium text-muted" dir="ltr">
                          {prod.nameEn}
                        </p>
                      )}

                      {prod.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-ink/75">
                          {prod.description}
                        </p>
                      )}

                      {/* Category & Subcategory Badges */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        {prod.isBestSeller && (
                          <span className="inline-flex items-center rounded-md bg-olive px-2 py-0.5 text-[11px] font-bold text-cream">
                            الأكثر مبيعاً
                          </span>
                        )}
                        <span className="inline-flex items-center rounded-full bg-cream-deep px-2.5 py-0.5 text-[11px] font-semibold text-olive">
                          {catName}
                        </span>
                        {subName && (
                          <span className="inline-flex items-center rounded-full bg-sand/80 px-2.5 py-0.5 text-[11px] font-medium text-ink">
                            {subName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/*Touch-Friendly Action Buttons Footer */}
                  <div className="mt-3.5 flex items-center gap-2.5 border-t border-sand/70 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-sand bg-cream/60 px-3 py-2 text-xs font-semibold text-olive transition hover:bg-olive hover:text-cream active:scale-[0.98]"
                    >
                      <EditIcon width={16} height={16} />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(prod)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-red-200/80 bg-red-50/50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-600 hover:text-white active:scale-[0.98]"
                    >
                      <TrashIcon width={16} height={16} />
                      <span>حذف</span>
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          {/* Desktop Table View (md and up) */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-sand bg-white/70 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start text-sm">
                <thead>
                  <tr className="border-b border-sand bg-cream-deep/60 text-xs font-semibold text-muted">
                    <th className="px-5 py-3.5 text-start">المنتج</th>
                    <th className="px-5 py-3.5 text-start">القسم الرئيسي / الفرعي</th>
                    <th className="px-5 py-3.5 text-start">السعر</th>
                    <th className="px-5 py-3.5 text-start">الرابط (Slug)</th>
                    <th className="px-5 py-3.5 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {filteredProducts.map((prod) => {
                    const catName = categoryMap.get(prod.categoryId) || 'غير محدد'
                    const subName = prod.subcategoryId ? subcategoryMap.get(prod.subcategoryId) : null
                    const imgCount = prod.images?.length || 0

                    return (
                      <tr
                        key={prod.id}
                        className="transition-colors hover:bg-cream-deep/30"
                      >
                        {/* Product Info & Thumbnail */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3.5">
                            <div className="relative size-14 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                              {prod.imageUrl ? (
                                <img
                                  src={prod.imageUrl}
                                  alt={prod.title}
                                  referrerPolicy="no-referrer"
                                  className="size-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="grid size-full place-items-center text-xs text-muted">
                                  بدون
                                </div>
                              )}
                              {imgCount > 1 && (
                                <span className="absolute bottom-1 end-1 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                                  +{imgCount - 1}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 max-w-xs">
                              <div className="flex items-center gap-2">
                                <span className="block truncate font-semibold text-ink">
                                  {prod.title}
                                </span>
                                {prod.isBestSeller && (
                                  <span className="shrink-0 rounded-md bg-olive px-2 py-0.5 text-[10px] font-bold text-cream">
                                    الأكثر مبيعاً
                                  </span>
                                )}
                              </div>
                              {prod.nameEn && (
                                <span className="block truncate text-[11px] text-muted" dir="ltr">
                                  {prod.nameEn}
                                </span>
                              )}
                              {prod.description && (
                                <p className="mt-0.5 line-clamp-1 text-xs text-ink/70">
                                  {prod.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category & Subcategory */}
                        <td className="px-5 py-4">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold text-olive">
                              {catName}
                            </span>
                            {subName && (
                              <span className="inline-flex items-center rounded-full bg-sand/80 px-2.5 py-1 text-xs font-medium text-ink">
                                {subName}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Price */}
                        <td className="px-5 py-4 font-bold text-olive">
                          {formatPrice(prod.price)}
                        </td>

                        {/* Slug */}
                        <td className="px-5 py-4">
                          {prod.slug ? (
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <code className="rounded bg-sand/60 px-2 py-0.5 font-mono text-xs text-ink">
                                {prod.slug}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(prod.slug, 'الـ slug')}
                                className="rounded p-1 text-muted transition hover:bg-sand hover:text-ink"
                                title="نسخ الرابط اللطيف"
                              >
                                <CopyIcon width={14} height={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(prod)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-olive transition hover:bg-olive hover:text-cream active:scale-95"
                              title="تعديل المنتج"
                            >
                              <EditIcon width={16} height={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(prod)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-red-600 transition hover:bg-red-600 hover:text-white active:scale-95"
                              title="حذف المنتج"
                            >
                              <TrashIcon width={16} height={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit / Add Modal */}
      <ProductModal
        open={modalOpen}
        product={editingProduct}
        categories={categories}
        subcategories={subcategories}
        defaultCategoryId={selectedCategoryId !== 'ALL' ? selectedCategoryId : ''}
        defaultSubcategoryId={selectedSubcategoryId !== 'ALL' ? selectedSubcategoryId : ''}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        itemName={productToDelete?.title}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
