import { useEffect } from 'react'
import { AlertCircleIcon, CloseIcon, Spinner } from './AdminIcons.jsx'

export default function ConfirmModal({
  open,
  title = 'تأكيد الحذف',
  message,
  itemName,
  warning,
  confirmLabel = 'حذف نهائي',
  loading = false,
  onConfirm,
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

      {/* Modal Dialog */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="relative w-full max-w-md rounded-2xl border border-sand bg-cream p-6 shadow-2xl transition-all"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-red-100 text-red-700">
              <AlertCircleIcon width={24} height={24} />
            </span>
            <h3 id="confirm-modal-title" className="text-lg font-bold text-ink">
              {title}
            </h3>
          </div>
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

        <div className="mt-4 text-sm text-ink/80 leading-relaxed">
          {message ? (
            <p>{message}</p>
          ) : (
            <p>
              هل أنتِ متأكدة من رغبتك في حذف <strong className="text-ink font-semibold">"{itemName}"</strong>؟
            </p>
          )}

          {warning && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-xs text-amber-900 leading-normal">
              ⚠️ {warning}
            </div>
          )}

          <p className="mt-2 text-xs text-muted">هذا الإجراء نهائي ولا يمكن التراجع عنه.</p>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-sand">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="min-h-11 rounded-full border border-sand-dark px-5 py-2.5 text-sm font-medium text-ink transition hover:bg-sand/60 active:scale-95 disabled:opacity-50"
          >
            إلغاء
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 active:scale-95 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                <span>جاري الحذف...</span>
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
