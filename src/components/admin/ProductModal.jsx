import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, PlusIcon, Spinner, TrashIcon, UploadIcon } from './AdminIcons.jsx'
import {
  compressImageFile,
  formatFileSize,
  resolveImageUrl,
} from '../../services/catalogApi.js'

function ProductForm({
  product,
  categories = [],
  subcategories = [],
  defaultCategoryId = '',
  defaultSubcategoryId = '',
  loading,
  onSave,
  onClose,
}) {
  const [categoryId, setCategoryId] = useState(
    () => product?.categoryId || defaultCategoryId || categories[0]?.id || '',
  )
  const [subcategoryId, setSubcategoryId] = useState(
    () => product?.subcategoryId || defaultSubcategoryId || '',
  )
  const [nameAr, setNameAr] = useState(() => product?.nameAr || product?.title || '')
  const [nameEn, setNameEn] = useState(() => product?.nameEn || '')
  const [descriptionAr, setDescriptionAr] = useState(
    () => product?.descriptionAr || product?.description || '',
  )
  const [descriptionEn, setDescriptionEn] = useState(() => product?.descriptionEn || '')
  const [price, setPrice] = useState(() =>
    product?.price !== undefined && product?.price !== null ? String(product.price) : '',
  )
  const [isBestSeller, setIsBestSeller] = useState(() => Boolean(product?.isBestSeller))
  const [existingImages, setExistingImages] = useState(() =>
    Array.isArray(product?.rawImages) && product.rawImages.length > 0
      ? product.rawImages
      : Array.isArray(product?.images)
        ? product.images
        : [],
  )
  const [imageFiles, setImageFiles] = useState([])
  const [filePreviews, setFilePreviews] = useState([])
  const [compressing, setCompressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [formError, setFormError] = useState('')
  const fileInputRef = useRef(null)

  const isEditing = Boolean(product?.id)
  const isBusy = loading || compressing

  // Filter subcategories belonging to the currently selected category
  const availableSubcategories = useMemo(() => {
    if (!categoryId) return []
    return subcategories.filter((s) => s.categoryId === categoryId)
  }, [subcategories, categoryId])

  // Ensure subcategory belongs to selected category when category changes
  const handleCategoryChange = (newCatId) => {
    setCategoryId(newCatId)
    const stillValid = subcategories.some(
      (s) => s.id === subcategoryId && s.categoryId === newCatId,
    )
    if (!stillValid) {
      setSubcategoryId('')
    }
  }

  useEffect(() => {
    return () => {
      filePreviews.forEach((u) => URL.revokeObjectURL(u.url))
    }
  }, [filePreviews])

  const handleSelectFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return
    const filesArray = Array.from(fileList)
    const invalid = filesArray.find((f) => !f.type.startsWith('image/'))
    if (invalid) {
      setFormError('يرجى اختيار ملفات صور صالحة فقط (JPG, PNG, WEBP...).')
      return
    }
    setFormError('')
    setCompressing(true)
    try {
      const compressedArray = await Promise.all(
        filesArray.map((file) => compressImageFile(file)),
      )
      const newPreviews = compressedArray.map((file) => ({
        name: file.name,
        size: file.size,
        originalSize: file.__originalSize || file.size,
        url: URL.createObjectURL(file),
      }))
      setImageFiles((prev) => [...prev, ...compressedArray])
      setFilePreviews((prev) => [...prev, ...newPreviews])
    } catch {
      setFormError('حدث خطأ أثناء ضغط الصور. حاولي مرة أخرى.')
    } finally {
      setCompressing(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveExistingImage = (idx) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleRemoveNewFile = (idx) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx))
    setFilePreviews((prev) => {
      const target = prev[idx]
      if (target?.url) URL.revokeObjectURL(target.url)
      return prev.filter((_, i) => i !== idx)
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmedAr = nameAr.trim()
    const trimmedEn = nameEn.trim()
    const trimmedDescAr = descriptionAr.trim()
    const trimmedDescEn = descriptionEn.trim()
    const numericPrice = Number(price)

    if (!categoryId && !subcategoryId) {
      setFormError('يرجى اختيار القسم الرئيسي أو الفرعي للمنتج.')
      return
    }

    if (!trimmedAr) {
      setFormError('يرجى إدخال اسم المنتج بالعربية.')
      return
    }

    if (!trimmedDescAr) {
      setFormError('يرجى إدخال وصف المنتج بالعربية.')
      return
    }

    if (price === '' || Number.isNaN(numericPrice) || numericPrice < 0) {
      setFormError('يرجى إدخال سعر صحيح للمنتج.')
      return
    }

    if (existingImages.length === 0 && imageFiles.length === 0) {
      setFormError('يرجى اختيار صورة واحدة على الأقل للمنتج من جهازك.')
      return
    }

    setFormError('')
    onSave({
      category: categoryId,
      subcategory: subcategoryId || null,
      name: {
        ar: trimmedAr,
        en: trimmedEn || trimmedAr,
      },
      description: {
        ar: trimmedDescAr,
        en: trimmedDescEn || trimmedDescAr,
      },
      price: numericPrice,
      isBestSeller,
      images: existingImages,
      imageFiles,
    })
  }

  const totalImagesCount = existingImages.length + imageFiles.length

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-sand bg-cream p-6 shadow-2xl transition-all"
    >
      <div className="flex items-center justify-between border-b border-sand pb-4">
        <h3 id="product-modal-title" className="text-xl font-bold text-olive">
          {isEditing ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد'}
        </h3>
        <button
          type="button"
          disabled={loading}
          onClick={onClose}
          className="grid size-9 place-items-center rounded-full text-muted transition hover:bg-sand/60 hover:text-ink disabled:opacity-50"
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

        {/* Category & Subcategory Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-category" className="block text-sm font-medium text-ink">
              القسم الرئيسي <span className="text-red-600">*</span>
            </label>
            <select
              id="prod-category"
              required
              disabled={loading}
              value={categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
            >
              <option value="" disabled>
                اختر القسم الرئيسي...
              </option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="prod-subcategory" className="block text-sm font-medium text-ink">
              القسم الفرعي <span className="text-xs font-normal text-muted">(اختياري)</span>
            </label>
            <select
              id="prod-subcategory"
              disabled={loading || availableSubcategories.length === 0}
              value={subcategoryId}
              onChange={(e) => setSubcategoryId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
            >
              <option value="">
                {availableSubcategories.length === 0
                  ? 'لا توجد أقسام فرعية لهذا القسم'
                  : 'بدون قسم فرعي (مباشر تحت القسم)'}
              </option>
              {availableSubcategories.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Arabic & English Name Row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-name-ar" className="block text-sm font-medium text-ink">
              اسم المنتج (بالعربية) <span className="text-red-600">*</span>
            </label>
            <input
              id="prod-name-ar"
              type="text"
              required
              disabled={loading}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: سجادة صلاة زرقاء"
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="prod-name-en" className="block text-sm font-medium text-ink">
              اسم المنتج (بالإنجليزية)
            </label>
            <input
              id="prod-name-en"
              type="text"
              dir="ltr"
              disabled={loading}
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="e.g. Blue Prayer Mat"
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60 text-left"
            />
          </div>
        </div>

        {/* Price & Best Seller Row */}
        <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
          <div>
            <label htmlFor="prod-price" className="block text-sm font-medium text-ink">
              السعر (ج.م) <span className="text-red-600">*</span>
            </label>
            <input
              id="prod-price"
              type="number"
              min="0"
              step="any"
              required
              dir="ltr"
              disabled={loading}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="400"
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60 text-left"
            />
          </div>

          <label
            htmlFor="prod-is-best-seller"
            className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition select-none ${
              isBestSeller
                ? 'border-olive bg-olive/10 text-olive'
                : 'border-sand bg-white/80 text-ink hover:border-olive/50'
            } ${loading ? 'pointer-events-none opacity-60' : ''}`}
          >
            <div className="flex flex-col">
              <span className="text-sm font-semibold">الأكثر مبيعاً (Best Seller)</span>
              <span className="text-[11px] text-muted">
                إظهار شارة الأكثر مبيعاً وعرضه في القسم الرئيسي
              </span>
            </div>
            <input
              id="prod-is-best-seller"
              type="checkbox"
              disabled={loading}
              checked={isBestSeller}
              onChange={(e) => setIsBestSeller(e.target.checked)}
              className="size-5 shrink-0 accent-olive cursor-pointer rounded"
            />
          </label>
        </div>

        {/* Arabic & English Description */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="prod-desc-ar" className="block text-sm font-medium text-ink">
              وصف المنتج (بالعربية) <span className="text-red-600">*</span>
            </label>
            <textarea
              id="prod-desc-ar"
              rows={3}
              required
              disabled={loading}
              value={descriptionAr}
              onChange={(e) => setDescriptionAr(e.target.value)}
              placeholder="مثال: سجادة صلاة زرقاء مريحة بخامة قطيفة ناعمة..."
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="prod-desc-en" className="block text-sm font-medium text-ink">
              وصف المنتج (بالإنجليزية)
            </label>
            <textarea
              id="prod-desc-en"
              rows={3}
              dir="ltr"
              disabled={loading}
              value={descriptionEn}
              onChange={(e) => setDescriptionEn(e.target.value)}
              placeholder="e.g. Comfy Blue Prayer Mat"
              className="mt-1.5 w-full rounded-xl border border-sand bg-white/80 px-4 py-2.5 text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:ring-1 focus:ring-olive disabled:opacity-60 text-left"
            />
          </div>
        </div>

        {/* Images Upload (Multiple supported) */}
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="prod-images-upload" className="block text-sm font-medium text-ink">
              صور المنتج <span className="text-red-600">*</span>
            </label>
            <span className="text-xs text-muted">
              {totalImagesCount > 0 ? `${totalImagesCount} صور محددة` : 'يمكنك اختيار صورة أو أكثر'}
            </span>
          </div>

          <input
            ref={fileInputRef}
            id="prod-images-upload"
            type="file"
            accept="image/*"
            multiple
            disabled={isBusy}
            onChange={(e) => handleSelectFiles(e.target.files)}
            className="sr-only"
          />

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              if (!isBusy) setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (!isBusy) handleSelectFiles(e.dataTransfer.files)
            }}
            onClick={() => !isBusy && fileInputRef.current?.click()}
            className={`mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-5 text-center transition ${
              isDragging
                ? 'border-olive bg-olive/10'
                : 'border-sand-dark/60 bg-white/70 hover:border-olive hover:bg-white'
            } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
          >
            {compressing ? (
              <>
                <Spinner className="size-7 text-olive" />
                <p className="mt-2 text-sm font-semibold text-ink">
                  جاري ضغط الصور وتجهيزها للرفع...
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  يتم ضغط الصور الكبيرة تلقائياً لتجنب حدود الرفع
                </p>
              </>
            ) : (
              <>
                <div className="grid size-10 place-items-center rounded-full bg-olive/10 text-olive">
                  <UploadIcon width={18} height={18} />
                </div>
                <p className="mt-2 text-sm font-semibold text-ink">
                  اضغطي لاختيار صور المنتج من جهازك أو اسحبيها هنا
                </p>
                <p className="mt-0.5 text-xs text-muted">
                  يتم ضغط الصور وتجهيزها تلقائياً لسرعة التصفح
                </p>
              </>
            )}
          </div>

          {/* Previews Grid */}
          {totalImagesCount > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {existingImages.map((imgUrl, idx) => (
                <div
                  key={`existing-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border border-sand bg-white"
                >
                  <img
                    src={resolveImageUrl(imgUrl, 400)}
                    alt={`صورة ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="size-full object-cover"
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-1.5 start-1.5 rounded-md bg-olive/90 px-2 py-0.5 text-[10px] font-semibold text-cream">
                      الرئيسية
                    </span>
                  )}
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRemoveExistingImage(idx)}
                    className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-red-600 text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
                    title="حذف الصورة"
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                </div>
              ))}

              {filePreviews.map((item, idx) => (
                <div
                  key={`new-${idx}`}
                  className="group relative aspect-square overflow-hidden rounded-xl border-2 border-olive/50 bg-white"
                >
                  <img src={item.url} alt={item.name} className="size-full object-cover" />
                  <span className="absolute inset-x-1.5 bottom-1.5 truncate rounded-md bg-emerald-800/90 px-1.5 py-0.5 text-center text-[10px] font-semibold text-white">
                    {formatFileSize(item.size)}
                  </span>
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => handleRemoveNewFile(idx)}
                    className="absolute end-1.5 top-1.5 grid size-7 place-items-center rounded-full bg-red-600 text-white shadow-xs transition hover:bg-red-700 disabled:opacity-50"
                    title="إزالة الصورة"
                  >
                    <TrashIcon width={13} height={13} />
                  </button>
                </div>
              ))}

              <button
                type="button"
                disabled={isBusy}
                onClick={() => fileInputRef.current?.click()}
                className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-sand-dark bg-white/50 text-xs font-medium text-muted transition hover:border-olive hover:text-olive disabled:opacity-50"
              >
                <PlusIcon width={18} height={18} />
                <span>إضافة المزيد</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-sand pt-4">
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
                <span>
                  {imageFiles.length > 0 ? 'جاري رفع الصور والحفظ...' : 'جاري الحفظ...'}
                </span>
              </>
            ) : compressing ? (
              <>
                <Spinner className="size-4" />
                <span>جاري ضغط الصور...</span>
              </>
            ) : isEditing ? (
              'حفظ التعديلات'
            ) : (
              'إضافة المنتج'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ProductModal({
  open,
  product,
  categories = [],
  subcategories = [],
  defaultCategoryId = '',
  defaultSubcategoryId = '',
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
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity"
        onClick={loading ? undefined : onClose}
        aria-hidden="true"
      />
      <ProductForm
        key={product?.id || 'new'}
        product={product}
        categories={categories}
        subcategories={subcategories}
        defaultCategoryId={defaultCategoryId}
        defaultSubcategoryId={defaultSubcategoryId}
        loading={loading}
        onSave={onSave}
        onClose={onClose}
      />
    </div>
  )
}
