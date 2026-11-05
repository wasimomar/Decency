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
import SubcategoryModal from './SubcategoryModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import {
  createSubcategory,
  deleteSubcategory,
  updateSubcategory,
} from '../../services/catalogApi.js'

export default function SubcategoryManager({
  categories = [],
  subcategories = [],
  loading = false,
  onRefresh,
  addToast,
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState('ALL')
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [subcategoryToDelete, setSubcategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Map category ID to title
  const categoryMap = useMemo(() => {
    const map = new Map()
    for (const c of categories) {
      map.set(c.id, c.title)
    }
    return map
  }, [categories])

  const filteredSubcategories = useMemo(() => {
    let list = subcategories

    if (selectedCategoryId !== 'ALL') {
      list = list.filter((s) => s.categoryId === selectedCategoryId)
    }

    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter((s) => {
        const catName = categoryMap.get(s.categoryId) || ''
        return (
          s.title?.toLowerCase().includes(q) ||
          s.nameEn?.toLowerCase().includes(q) ||
          s.slug?.toLowerCase().includes(q) ||
          catName.toLowerCase().includes(q)
        )
      })
    }

    return list
  }, [subcategories, selectedCategoryId, search, categoryMap])

  const handleOpenAdd = () => {
    setEditingSubcategory(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (sub) => {
    setEditingSubcategory(sub)
    setModalOpen(true)
  }

  const handleOpenDelete = (sub) => {
    setSubcategoryToDelete(sub)
    setDeleteModalOpen(true)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, payload)
        addToast({
          type: 'success',
          title: 'تم التعديل بنجاح',
          message: `تم تحديث قسم "${payload.name.ar}" بنجاح.`,
        })
      } else {
        await createSubcategory(payload)
        addToast({
          type: 'success',
          title: 'تمت الإضافة بنجاح',
          message: `تمت إضافة قسم "${payload.name.ar}" بنجاح.`,
        })
      }
      setModalOpen(false)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'فشلت العملية',
        message: err.message || 'حدث خطأ أثناء حفظ القسم الفرعي.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!subcategoryToDelete) return
    setDeleting(true)
    try {
      await deleteSubcategory(subcategoryToDelete.id)
      addToast({
        type: 'success',
        title: 'تم الحذف',
        message: `تم حذف قسم "${subcategoryToDelete.title}" بنجاح.`,
      })
      setDeleteModalOpen(false)
      setSubcategoryToDelete(null)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'تعذر الحذف',
        message: err.message || 'حدث خطأ أثناء حذف القسم الفرعي.',
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
              إدارة الأقسام الفرعية
            </h2>
            <span className="rounded-full bg-olive/10 px-3 py-0.5 text-xs font-semibold text-olive">
              {subcategories.length} أقسام فرعية
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            تنظيم وتصنيف المجموعات الفرعية المندرجة تحت كل قسم رئيسي.
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
            <span>إضافة قسم فرعي</span>
          </button>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="grid gap-3 sm:grid-cols-[1fr_260px]">
        {/* Search Input */}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted">
            <SearchIcon width={18} height={18} />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحثي عن قسم فرعي، الرابط اللطيف (slug)، أو القسم الرئيسي..."
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

        {/* Parent Category Filter Dropdown */}
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-3 text-muted">
            <FilterIcon width={16} height={16} />
          </span>
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className="min-h-12 w-full appearance-none rounded-2xl border border-sand bg-white/80 py-3 pe-8 ps-9 text-sm text-ink outline-none transition focus:border-olive"
          >
            <option value="ALL">جميع الأقسام الرئيسية ({subcategories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                قسم: {c.title}
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
          ⚠️ لا توجد أقسام رئيسية مضافة بعد. يجب إضافة قسم رئيسي أولاً قبل إضافة أقسام فرعية.
        </div>
      )}

      {/* Main Content Area */}
      {loading && !subcategories.length ? (
        <div className="rounded-2xl border border-sand bg-white/50 p-12 text-center">
          <Spinner className="mx-auto size-8 text-olive" />
          <p className="mt-3 text-sm text-muted">جاري تحميل الأقسام الفرعية...</p>
        </div>
      ) : filteredSubcategories.length === 0 ? (
        <div className="rounded-2xl border border-sand bg-white/40 p-10 sm:p-12 text-center">
          <p className="text-base font-semibold text-ink">لم يتم العثور على أي أقسام فرعية</p>
          <p className="mt-1 text-xs text-muted">
            {search || selectedCategoryId !== 'ALL'
              ? 'جرّبي تغيير معايير البحث أو اختيار قسم رئيسي آخر.'
              : 'ابدئي بإضافة أول قسم فرعي تابع لقسمك المفضل.'}
          </p>
          {categories.length > 0 && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-olive-soft"
            >
              <PlusIcon width={16} height={16} />
              <span>إضافة قسم فرعي الآن</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Stacked Cards View (< md) */}
          <div className="grid gap-3.5 md:hidden">
            {filteredSubcategories.map((sub) => {
              const parentName = categoryMap.get(sub.categoryId) || 'غير معروف'
              return (
                <article
                  key={sub.id}
                  className="rounded-2xl border border-sand bg-white/85 p-4 shadow-xs transition hover:border-olive/40"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Subcategory Thumbnail */}
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                      {sub.imageUrl ? (
                        <img
                          src={sub.imageUrl}
                          alt={sub.title}
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
                    </div>

                    {/* Names & Parent Category Badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ink">{sub.title}</h3>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-olive/10 px-2.5 py-1 text-xs font-semibold text-olive">
                          {parentName}
                        </span>
                      </div>

                      <p
                        className="mt-1 truncate text-xs font-medium text-muted"
                        dir="ltr"
                      >
                        {sub.nameEn || '—'}
                      </p>

                      {sub.slug && (
                        <div className="mt-2 flex items-center gap-1.5" dir="ltr">
                          <code className="truncate rounded-md bg-sand/60 px-2 py-0.5 font-mono text-[11px] text-ink">
                            {sub.slug}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopy(sub.slug, 'الـ slug')}
                            className="grid size-7 shrink-0 place-items-center rounded-md text-muted transition hover:bg-sand hover:text-ink"
                            title="نسخ الرابط اللطيف"
                          >
                            <CopyIcon width={13} height={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Touch-Friendly Action Buttons Footer */}
                  <div className="mt-3.5 flex items-center gap-2.5 border-t border-sand/70 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(sub)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-sand bg-cream/60 px-3 py-2 text-xs font-semibold text-olive transition hover:bg-olive hover:text-cream active:scale-[0.98]"
                    >
                      <EditIcon width={16} height={16} />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(sub)}
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
                    <th className="px-5 py-3.5 text-start">القسم الفرعي</th>
                    <th className="px-5 py-3.5 text-start">القسم الرئيسي التابع له</th>
                    <th className="px-5 py-3.5 text-start">الرابط المباشر (Slug)</th>
                    <th className="px-5 py-3.5 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {filteredSubcategories.map((sub) => {
                    const parentName = categoryMap.get(sub.categoryId) || 'غير معروف'
                    return (
                      <tr
                        key={sub.id}
                        className="transition-colors hover:bg-cream-deep/30"
                      >
                        {/* Subcategory name & thumbnail */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                              {sub.imageUrl ? (
                                <img
                                  src={sub.imageUrl}
                                  alt={sub.title}
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
                            </div>
                            <div>
                              <span className="font-semibold text-ink">{sub.title}</span>
                              <span className="block text-[11px] font-normal text-muted" dir="ltr">
                                {sub.nameEn || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Parent category */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-olive/10 px-3 py-1 text-xs font-semibold text-olive">
                            {parentName}
                          </span>
                        </td>

                        {/* Slug */}
                        <td className="px-5 py-4">
                          {sub.slug ? (
                            <div className="flex items-center gap-1.5" dir="ltr">
                              <code className="rounded bg-sand/60 px-2 py-0.5 font-mono text-xs text-ink">
                                {sub.slug}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopy(sub.slug, 'الـ slug')}
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
                              onClick={() => handleOpenEdit(sub)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-olive transition hover:bg-olive hover:text-cream active:scale-95"
                              title="تعديل القسم الفرعي"
                            >
                              <EditIcon width={16} height={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(sub)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-red-600 transition hover:bg-red-600 hover:text-white active:scale-95"
                              title="حذف القسم الفرعي"
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
      <SubcategoryModal
        open={modalOpen}
        subcategory={editingSubcategory}
        categories={categories}
        defaultCategoryId={selectedCategoryId !== 'ALL' ? selectedCategoryId : ''}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        itemName={subcategoryToDelete?.title}
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
