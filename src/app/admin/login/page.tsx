'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../../lib/firebase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const token = await userCredential.user.getIdToken()
      
      const sessionRes = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      
      if (!sessionRes.ok) {
        throw new Error(`Session failed: ${sessionRes.status}`)
      }

      // Small delay to ensure cookie is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100))
      router.push('/admin')
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0f0d] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center gap-3 mb-2">
            <img src="/lrct.svg" alt="LRCT Logo" className="w-16 h-16 object-contain" />
            <h1 className="text-white text-2xl font-bold tracking-tight">LRCT CMS
              <p className="text-[#6b7c6e] text-sm">Land Rover Club Tanzania</p>
            </h1>
          </div>
        </div>

        <form onSubmit={handleLogin} className="bg-[#111a13] border border-[#1e3324] rounded-2xl p-8 space-y-5">
          <div>
            <label className="block text-[#9aafa0] text-xs font-semibold uppercase tracking-widest mb-2">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="admin@landroverclub.or.tz" required
              className="w-full bg-[#0a0f0d] border border-[#2a3d2e] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80] transition-colors placeholder:text-[#3a4f3e]" />
          </div>
          <div>
            <label className="block text-[#9aafa0] text-xs font-semibold uppercase tracking-widest mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password" required
              className="w-full bg-[#0a0f0d] border border-[#2a3d2e] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#4ade80] transition-colors placeholder:text-[#3a4f3e]" />
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-900/50 text-red-400 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#4ade80] hover:bg-[#22c55e] text-[#0a0f0d] font-bold rounded-xl py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
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

        <p className="text-center text-[#3a4f3e] text-xs mt-6">landroverclub.or.tz · CMS v1.0</p>

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
