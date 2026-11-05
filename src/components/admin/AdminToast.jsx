import { AlertCircleIcon, CheckCircleIcon, CloseIcon } from './AdminIcons.jsx'

export default function AdminToast({ toasts = [], onDismiss }) {
  if (!toasts.length) return null

  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-20 z-50 flex max-w-sm flex-col gap-2.5 transition-all sm:inset-x-auto sm:start-6 lg:bottom-6"
    >
      {toasts.map((toast) => {
        const isError = toast.type === 'error'
        return (
          <div
            key={toast.id}
            role={isError ? 'alert' : 'status'}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${
              isError
                ? 'border-red-200 bg-red-50/95 text-red-900 shadow-red-900/5'
                : 'border-olive/20 bg-cream/95 text-ink shadow-olive/10'
            }`}
          >
            <span className={`mt-0.5 shrink-0 ${isError ? 'text-red-600' : 'text-olive'}`}>
              {isError ? <AlertCircleIcon width={20} height={20} /> : <CheckCircleIcon width={20} height={20} />}
            </span>
            <div className="flex-1 text-sm">
              {toast.title && <p className="font-semibold">{toast.title}</p>}
              <p className={toast.title ? 'mt-0.5 text-xs opacity-90' : 'text-sm'}>{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-muted transition hover:text-ink"
              aria-label="إغلاق التنبيه"
            >
              <CloseIcon width={16} height={16} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
