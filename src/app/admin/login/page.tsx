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
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a2e1f] border border-[#2d4f35] mb-4">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-[#4ade80]" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
            </svg>
          </div>
          <h1 className="text-white text-2xl font-bold tracking-tight">LRCT Admin</h1>
          <p className="text-[#6b7c6e] text-sm mt-1">Land Rover Club Tanzania</p>
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
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-[#3a4f3e] text-xs mt-6">
          landroverclub.or.tz · CMS v1.0
        </p>
      </div>
    </div>
  )
}
