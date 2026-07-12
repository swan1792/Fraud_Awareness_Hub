import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ShieldAlert, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth'

export function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <ShieldAlert className="h-12 w-12 text-red-600 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">{t("login.title")}</h1>
          <p className="text-sm text-gray-500 mt-1">{t("login.subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-md px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("login.email")}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="admin@fraudhub.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("login.password")}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? t("login.signingIn") : t("login.signIn")}
          </button>
        </form>

        {/* Demo Credentials */}
        <div className="mt-4 bg-blue-50 rounded-lg border border-blue-200 p-4">
          <p className="text-xs font-semibold text-blue-800 mb-2">{t("login.demoTitle")}</p>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => { setEmail('admin@fraudhub.com'); setPassword('Admin@123') }}
              className="w-full text-left bg-white rounded-md px-3 py-2 border border-blue-100 hover:border-blue-300 transition-colors"
            >
              <p className="text-xs font-medium text-gray-700">{t("login.superAdmin")}</p>
              <p className="text-xs text-gray-500">admin@fraudhub.com / Admin@123</p>
            </button>
            <button
              type="button"
              onClick={() => { setEmail('test@test.com'); setPassword('Test@123') }}
              className="w-full text-left bg-white rounded-md px-3 py-2 border border-blue-100 hover:border-blue-300 transition-colors"
            >
              <p className="text-xs font-medium text-gray-700">{t("login.normalAdmin")}</p>
              <p className="text-xs text-gray-500">test@test.com / Test@123</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
