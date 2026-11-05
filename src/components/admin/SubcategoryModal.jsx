import { useEffect, useRef, useState } from 'react'
import { CloseIcon, Spinner, TrashIcon, UploadIcon } from './AdminIcons.jsx'
import {
  compressImageFile,
  formatFileSize,
  resolveImageUrl,
} from '../../services/catalogApi.js'

function SubcategoryForm({
  subcategory,
  categories = [],
  defaultCategoryId = '',
  loading,
  onSave,
  onClose,
}) {
  const [categoryId, setCategoryId] = useState(
    () => subcategory?.categoryId || defaultCategoryId || categories[0]?.id || '',
  )
  const [nameAr, setNameAr] = useState(() => subcategory?.nameAr || subcategory?.title || '')
  const [nameEn, setNameEn] = useState(() => subcategory?.nameEn || '')
  const [existingImage, setExistingImage] = useState(() => subcategory?.rawImage || subcategory?.image || '')
  const [imageFile, setImageFile] = useState(null)
  const [filePreview, setFilePreview] = useState('')
  const [compressing, setCompressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef(null)

  const isEditing = Boolean(subcategory?.id)
  const isBusy = loading || compressing

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview)
    }
  }, [filePreview])

  const previewUrl = filePreview || resolveImageUrl(existingImage, 400)

  const handleSelectFile = async (file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setFormError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP...).')
      return
    }
    setFormError('')
    setCompressing(true)
    try {
      const compressed = await compressImageFile(file)
      setImageFile(compressed)
      setFilePreview((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(compressed)
      })
    } catch {
      setFormError('حدث خطأ أثناء ضغط الصورة. حاولي مرة أخرى.')
    } finally {
      setCompressing(false)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setFilePreview('')
    setExistingImage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedAr = nameAr.trim()
    const trimmedEn = nameEn.trim()

    if (!categoryId) {
      setFormError('يرجى اختيار القسم الرئيسي التابع له هذا القسم الفرعي.')
      return
    }

    if (!trimmedAr) {
      setFormError('يرجى إدخال اسم القسم الفرعي بالعربية.')
      return
    }

    setFormError('')
    onSave({
      category: categoryId,
      name: {
        ar: trimmedAr,
        en: trimmedEn || trimmedAr,
      },
      image: existingImage,
      imageFile,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subcat-modal-title"
      className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-sand bg-cream p-5 sm:p-6 shadow-2xl transition-all"
    >
      <div className="flex items-center justify-between border-b border-sand pb-4">
        <h3 id="subcat-modal-title" className="text-lg sm:text-xl font-bold text-olive">
          {isEditing ? 'تعديل القسم الفرعي' : 'إضافة قسم فرعي جديد'}
        </h3>
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="grid size-11 place-items-center rounded-full text-muted transition hover:bg-sand/60 hover:text-ink disabled:opacity-50"
          aria-label="إغلاق"
        >
          <CloseIcon width={18} height={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
            {formError}
          </div>
        )}

        <div>
          <label htmlFor="subcat-parent" className="block text-sm font-medium text-ink">
            القسم الرئيسي التابع له <span className="text-red-600">*</span>
          </label>
          <select
            id="subcat-parent"
            required
            disabled={loading}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
          >
            <option value="" disabled>
              اختر القسم الرئيسي...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}{c.nameEn ? ` (${c.nameEn})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="subcat-name-ar" className="block text-sm font-medium text-ink">
            اسم القسم الفرعي (بالعربية) <span className="text-red-600">*</span>
          </label>
          <input
            id="subcat-name-ar"
            type="text"
            required
            disabled={loading}
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
            placeholder="مثال: إسدال بليسيه، إسدال صيفي"
            className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
          />
        </div>

        <div>
          <label htmlFor="subcat-name-en" className="block text-sm font-medium text-ink">
            اسم القسم الفرعي (بالإنجليزية)
          </label>
          <input
            id="subcat-name-en"
            type="text"
            dir="ltr"
            disabled={loading}
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="e.g. Summer Esdal, Bleseh Esdal"
            className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60 text-left"
          />
        </div>

        <div>
          <label htmlFor="subcat-image-upload" className="block text-sm font-medium text-ink">
            صورة القسم الفرعي
          </label>
          <input
            ref={fileInputRef}
            id="subcat-image-upload"
            type="file"
            accept="image/*"
            disabled={isBusy}
            onChange={(e) => handleSelectFile(e.target.files?.[0])}
            className="sr-only"
          />

          {compressing ? (
            <div className="mt-1.5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-olive/50 bg-olive/5 px-4 py-6 text-center">
              <Spinner className="size-7 text-olive" />
              <p className="mt-2.5 text-sm font-semibold text-ink">
                جاري ضغط الصورة وتجهيزها للرفع...
              </p>
              <p className="mt-1 text-xs text-muted">
                يتم تقليل حجم الصورة تلقائياً لضمان سرعة الرفع
              </p>
            </div>
          ) : !previewUrl ? (
            <div
              onDragOver={(e) => {
                e.preventDefault()
                if (!isBusy) setIsDragging(true)
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                if (!isBusy) handleSelectFile(e.dataTransfer.files?.[0])
              }}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
                isDragging
                  ? 'border-olive bg-olive/10'
                  : 'border-sand-dark/60 bg-white/70 hover:border-olive hover:bg-white'
              } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
            >
              <div className="grid size-11 place-items-center rounded-full bg-olive/10 text-olive">
                <UploadIcon width={20} height={20} />
              </div>
              <p className="mt-2.5 text-sm font-semibold text-ink">
                اضغطي لاختيار صورة من جهازك أو اسحبيها هنا
              </p>
              <p className="mt-1 text-xs text-muted">
                يتم ضغط الصور وتجهيزها تلقائياً لسرعة التحميل
              </p>
            </div>
          ) : (
            <div className="mt-1.5 rounded-2xl border border-sand bg-cream-deep p-3.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-xl border border-sand bg-white">
                    <img
                      src={previewUrl}
                      alt="معاينة"
                      referrerPolicy="no-referrer"
                      className="size-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="truncate font-semibold text-ink">
                      {imageFile ? imageFile.name : 'الصورة الحالية للقسم الفرعي'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-emerald-700 font-medium">
                      {imageFile
                        ? imageFile.__originalSize && imageFile.__originalSize > imageFile.size
                          ? `تم الضغط: ${formatFileSize(imageFile.__originalSize)} ← ${formatFileSize(imageFile.size)}`
                          : `${formatFileSize(imageFile.size)} — مضغوطة وجاهزة للرفع`
                        : 'صورة القسم الفرعي الحالية'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-sand-dark bg-white px-2.5 py-1 text-xs font-medium text-ink transition hover:bg-sand/60 disabled:opacity-50"
                      >
                        <UploadIcon width={13} height={13} />
                        <span>تغيير الصورة</span>
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={handleRemoveImage}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <TrashIcon width={13} height={13} />
                        <span>إزالة</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-sand">
          <button
            type="button"
            disabled={isBusy}
            onClick={onClose}
            className="rounded-full border border-sand-dark px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-sand/60 active:scale-95 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-full bg-olive px-6 py-2.5 text-sm font-medium text-cream shadow-sm transition hover:bg-olive-soft active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                <span>{imageFile ? 'جاري رفع الصورة والحفظ...' : 'جاري الحفظ...'}</span>
              </>
            ) : compressing ? (
              <>
                <Spinner className="size-4" />
                <span>جاري ضغط الصورة...</span>
              </>
            ) : isEditing ? (
              'حفظ التعديلات'
            ) : (
              'إضافة القسم الفرعي'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function SubcategoryModal({
  open,
  subcategory,
  categories = [],
  defaultCategoryId = '',
  loading,
  onSave,
  onClose,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && !loading && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, loading, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />

      <SubcategoryForm
        key={subcategory?.id || 'new'}
        subcategory={subcategory}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        loading={loading}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  )
}
