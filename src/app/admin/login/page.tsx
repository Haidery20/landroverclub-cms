'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
      router.refresh()
    } else {
      setError('Incorrect password. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <div>
              <img src="/lrct.svg" alt="LRCT Logo" className="w-16 h-16 object-contain" />
            </div>
            <h1 className="text-white text-2xl font-bold tracking-tight">LRCT CMS
              <p className="text-[#6b7c6e] text-sm">Land Rover Club Tanzania</p>
            </h1>
          </div>
        </div>

        {/* Login Card */}
        <form onSubmit={handleLogin} className="bg-[#111a13] border border-[#1e3324] rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-[#9aafa0] text-xs font-semibold uppercase tracking-widest mb-2">
              Admin Password
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              className="w-full bg-[#0a0f0d] border border-[#2a3d2e] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80] transition-colors placeholder:text-[#3a4f3e]"
            />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0a0f0d] font-bold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                </svg>
                Signing in…
              </span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[#3a4f3e] text-xs mt-6">
          landroverclub.or.tz · CMS v1.0
        </p>
        {loading && (
          <div className="fixed inset-0 bg-[#0a0f0d] z-50 flex flex-col items-center justify-center gap-6">
            <div className="w-32 h-32 rounded-full bg-[#e8f0e0] flex items-center justify-center animate-pulse">
              <img src="/lrct.svg" alt="LRCT Logo" className="w-28 h-28 object-contain" />
            </div>
            <div className="w-10 h-10 border-4 border-[#4ade80] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#4a6050] text-sm tracking-widest uppercase">Signing in…</p>
          </div>
        )}
      </div>
    </div>
  )
}
