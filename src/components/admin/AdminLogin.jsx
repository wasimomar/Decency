import { useState } from 'react'
import Logo from '../Logo.jsx'
import {
  AlertCircleIcon,
  EyeIcon,
  EyeOffIcon,
  LockIcon,
  Spinner,
  StoreIcon,
} from './AdminIcons.jsx'
import { loginAdmin } from '../../services/catalogApi.js'

export default function AdminLogin({ onSuccess, onNavigateToStore, initialMessage = '' }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialMessage)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = password.trim()
    if (!trimmed) {
      setError('يرجى إدخال كلمة المرور للمتابعة.')
      return
    }

    setError('')
    setLoading(true)
    try {
      await loginAdmin(trimmed)
      onSuccess?.()
    } catch (err) {
      setError(err.message || 'كلمة المرور غير صحيحة. يرجى التأكد والمحاولة مرة أخرى.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-cream text-ink flex flex-col items-center justify-center p-4 sm:p-6"
    >
      <div className="w-full max-w-md rounded-3xl border border-sand bg-white/85 p-6 sm:p-8 shadow-xl backdrop-blur-sm">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <Logo />
          <div className="mt-5 grid size-14 place-items-center rounded-2xl bg-olive/10 text-olive">
            <LockIcon width={26} height={26} />
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl font-bold text-ink">
            تسجيل الدخول إلى لوحة التحكم
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted leading-relaxed">
            يرجى إدخال كلمة المرور الخاصة بالمسؤول للوصول إلى إدارة الأقسام والمنتجات.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50/95 p-3.5 text-xs sm:text-sm text-red-800"
            >
              <AlertCircleIcon width={18} height={18} className="mt-0.5 shrink-0 text-red-600" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="admin-password-input" className="block text-sm font-semibold text-ink">
              كلمة المرور
            </label>
            <div className="relative mt-2">
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                className="absolute inset-y-0 start-0 z-10 grid w-12 place-items-center text-muted transition hover:text-ink"
              >
                {showPassword ? (
                  <EyeOffIcon width={18} height={18} />
                ) : (
                  <EyeIcon width={18} height={18} />
                )}
              </button>
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                dir="ltr"
                autoFocus
                required
                disabled={loading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="••••••••••••"
                className="min-h-12 w-full rounded-2xl border border-sand bg-cream/50 py-3 ps-12 pe-4 text-left font-mono text-sm text-ink outline-none transition placeholder:text-muted focus:border-olive focus:bg-white focus:ring-2 focus:ring-olive/20 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-olive px-6 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-olive-soft active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Spinner className="size-4" />
                <span>جاري التحقق من كلمة المرور...</span>
              </>
            ) : (
              <span>دخول لوحة التحكم</span>
            )}
          </button>
        </form>

        {/* Back to Store Link */}
        <div className="mt-6 border-t border-sand/80 pt-4">
          <button
            type="button"
            onClick={onNavigateToStore}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-sand-dark bg-cream/60 px-4 py-2.5 text-xs sm:text-sm font-semibold text-ink transition hover:bg-sand/60 active:scale-[0.99]"
          >
            <StoreIcon width={17} height={17} />
            <span>العودة إلى المتجر</span>
          </button>
        </div>
      </div>
    </div>
  )
}

