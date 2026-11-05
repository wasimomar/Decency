import { useMemo, useState } from 'react'
import {
  EditIcon,
  PlusIcon,
  RefreshIcon,
  SearchIcon,
  Spinner,
  TrashIcon,
} from './AdminIcons.jsx'
import CategoryModal from './CategoryModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from '../../services/catalogApi.js'

export default function CategoryManager({
  categories = [],
  subcategories = [],
  loading = false,
  onRefresh,
  addToast,
}) {
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [saving, setSaving] = useState(false)

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Map subcategory count per category ID
  const subcatCountMap = useMemo(() => {
    const map = new Map()
    for (const sub of subcategories) {
      const cId = sub.categoryId
      if (cId) {
        map.set(cId, (map.get(cId) || 0) + 1)
      }
    }
    return map
  }, [subcategories])

  const filteredCategories = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return categories
    return categories.filter((c) => {
      return (
        c.title?.toLowerCase().includes(q) ||
        c.nameEn?.toLowerCase().includes(q)
      )
    })
  }, [categories, search])

  const handleOpenAdd = () => {
    setEditingCategory(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (category) => {
    setEditingCategory(category)
    setModalOpen(true)
  }

  const handleOpenDelete = (category) => {
    setCategoryToDelete(category)
    setDeleteModalOpen(true)
  }

  const handleSave = async (payload) => {
    setSaving(true)
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, payload)
        addToast({
          type: 'success',
          title: 'تم التعديل بنجاح',
          message: `تم تحديث بيانات قسم "${payload.name.ar}" بنجاح.`,
        })
      } else {
        await createCategory(payload)
        addToast({
          type: 'success',
          title: 'تمت الإضافة بنجاح',
          message: `تمت إضافة قسم "${payload.name.ar}" إلى المتجر.`,
        })
      }
      setModalOpen(false)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'فشلت العملية',
        message: err.message || 'حدث خطأ أثناء حفظ القسم.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      await deleteCategory(categoryToDelete.id)
      addToast({
        type: 'success',
        title: 'تم الحذف',
        message: `تم حذف قسم "${categoryToDelete.title}" بنجاح.`,
      })
      setDeleteModalOpen(false)
      setCategoryToDelete(null)
      onRefresh?.()
    } catch (err) {
      addToast({
        type: 'error',
        title: 'تعذر الحذف',
        message: err.message || 'حدث خطأ أثناء حذف القسم.',
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top action header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-xl font-bold text-ink sm:text-2xl">
              إدارة الأقسام الرئيسية
            </h2>
            <span className="rounded-full bg-olive/10 px-3 py-0.5 text-xs font-semibold text-olive">
              {categories.length} أقسام
            </span>
          </div>
          <p className="mt-1 text-xs text-muted sm:text-sm">
            عرض وتعديل وإضافة الأقسام الرئيسية التي تظهر في المتجر والـ Drawer.
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
            className="inline-flex min-h-11 flex-1 sm:flex-initial items-center justify-center gap-2 rounded-xl bg-olive px-4 py-2.5 text-sm font-medium text-cream shadow-sm transition hover:bg-olive-soft active:scale-95"
          >
            <PlusIcon width={18} height={18} />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4 text-muted">
          <SearchIcon width={18} height={18} />
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحثي عن قسم بالاسم العربي أو الإنجليزي..."
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

      {/* Main Content Area */}
      {loading && !categories.length ? (
        <div className="rounded-2xl border border-sand bg-white/50 p-12 text-center">
          <Spinner className="mx-auto size-8 text-olive" />
          <p className="mt-3 text-sm text-muted">جاري تحميل الأقسام من الخادم...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="rounded-2xl border border-sand bg-white/40 p-10 sm:p-12 text-center">
          <p className="text-base font-semibold text-ink">لم يتم العثور على أي أقسام</p>
          <p className="mt-1 text-xs text-muted">
            {search ? 'جرّبي تغيير كلمات البحث.' : 'ابدئي بإضافة أول قسم رئيسي إلى المتجر.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-olive px-5 py-2.5 text-sm font-medium text-cream transition hover:bg-olive-soft"
            >
              <PlusIcon width={16} height={16} />
              <span>إضافة قسم الآن</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile Stacked Cards View (< md) */}
          <div className="grid gap-3.5 md:hidden">
            {filteredCategories.map((c) => {
              const subCount = subcatCountMap.get(c.id) || 0
              return (
                <article
                  key={c.id}
                  className="rounded-2xl border border-sand bg-white/85 p-4 shadow-xs transition hover:border-olive/40"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Category Thumbnail */}
                    <div className="size-16 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                      {c.imageUrl ? (
                        <img
                          src={c.imageUrl}
                          alt={c.title}
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

                    {/* Names & Subcategory Count Badge */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="text-base font-bold text-ink">{c.title}</h3>
                        <span className="inline-flex shrink-0 items-center rounded-full bg-cream-deep px-2.5 py-1 text-xs font-semibold text-olive">
                          {subCount} أقسام فرعية
                        </span>
                      </div>
                      <p
                        className="mt-1 truncate text-xs font-medium text-muted"
                        dir="ltr"
                      >
                        {c.nameEn || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Touch-Friendly Action Buttons Footer */}
                  <div className="mt-3.5 flex items-center gap-2.5 border-t border-sand/70 pt-3">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(c)}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-sand bg-cream/60 px-3 py-2 text-xs font-semibold text-olive transition hover:bg-olive hover:text-cream active:scale-[0.98]"
                    >
                      <EditIcon width={16} height={16} />
                      <span>تعديل</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenDelete(c)}
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
                    <th className="px-5 py-3.5 text-start">القسم</th>
                    <th className="px-5 py-3.5 text-start">الاسم بالإنجليزية</th>
                    <th className="px-5 py-3.5 text-start">الأقسام الفرعية التابعة</th>
                    <th className="px-5 py-3.5 text-end">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/70">
                  {filteredCategories.map((c) => {
                    const subCount = subcatCountMap.get(c.id) || 0
                    return (
                      <tr
                        key={c.id}
                        className="transition-colors hover:bg-cream-deep/30"
                      >
                        {/* Name & Thumbnail */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-12 shrink-0 overflow-hidden rounded-xl border border-sand bg-cream-deep">
                              {c.imageUrl ? (
                                <img
                                  src={c.imageUrl}
                                  alt={c.title}
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
                              <span className="font-semibold text-ink">{c.title}</span>
                            </div>
                          </div>
                        </td>

                        {/* English name */}
                        <td className="px-5 py-4 text-xs font-medium text-ink/80" dir="ltr">
                          {c.nameEn || '—'}
                        </td>

                        {/* Subcategories count */}
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-full bg-cream-deep px-3 py-1 text-xs font-medium text-olive">
                            {subCount} أقسام فرعية
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEdit(c)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-olive transition hover:bg-olive hover:text-cream active:scale-95"
                              title="تعديل القسم"
                            >
                              <EditIcon width={16} height={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDelete(c)}
                              className="grid size-10 place-items-center rounded-xl border border-sand bg-white text-red-600 transition hover:bg-red-600 hover:text-white active:scale-95"
                              title="حذف القسم"
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
      <CategoryModal
        open={modalOpen}
        category={editingCategory}
        loading={saving}
        onSave={handleSave}
        onClose={() => setModalOpen(false)}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={deleteModalOpen}
        itemName={categoryToDelete?.title}
        warning={
          categoryToDelete && (subcatCountMap.get(categoryToDelete.id) || 0) > 0
            ? `تنبيه: هذا القسم يرتبط به (${subcatCountMap.get(categoryToDelete.id)}) أقسام فرعية. قد يؤثر الحذف عليها!`
            : null
        }
        loading={deleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteModalOpen(false)}
      />
    </div>
  )
}
