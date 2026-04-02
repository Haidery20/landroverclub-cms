'use client'
import { useState, useEffect } from 'react'
import { MembershipTier, MembershipApplication, ApplicationStatus } from '@/lib/types'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const statusColors: Record<ApplicationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  waitlisted: 'bg-blue-100 text-blue-700',
}

const blankTier = {
  name: '', price_tzs: 0, price_usd: 0, period: 'annual',
  description: '', benefits: [] as string[],
  is_active: true, is_featured: false, sort_order: 0,
}

type Tab = 'tiers' | 'applications'

export default function MembershipPage() {
  const [tab, setTab] = useState<Tab>('tiers')
  const [tiers, setTiers] = useState<MembershipTier[]>([])
  const [applications, setApplications] = useState<MembershipApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTier, setEditingTier] = useState<MembershipTier | 'new' | null>(null)
  const [tierForm, setTierForm] = useState(blankTier)
  const [benefitInput, setBenefitInput] = useState('')
  const [savingTier, setSavingTier] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<MembershipTier | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [selectedApp, setSelectedApp] = useState<MembershipApplication | null>(null)
  const [appFilter, setAppFilter] = useState<ApplicationStatus | 'all'>('all')

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    try {
      setError(null)
      setLoading(true)
      const [tiersRes, appsRes] = await Promise.all([
        fetch('/api/admin/membership/tiers'),
        fetch('/api/admin/membership/applications'),
      ])

      if (!tiersRes.ok || !appsRes.ok) {
        throw new Error(`Failed to fetch data: ${tiersRes.status} ${appsRes.status}`)
      }

      const t = await tiersRes.json()
      const a = await appsRes.json()
      setTiers(t)
      setApplications(a)
      setLoading(false)
    } catch (err) {
      console.error('Failed to load membership data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load membership data')
      setLoading(false)
    }
  }

  function openNewTier() { setTierForm(blankTier); setBenefitInput(''); setEditingTier('new') }
  function openEditTier(t: MembershipTier) {
    setTierForm({
      name: t.name, price_tzs: t.price_tzs ?? 0, price_usd: t.price_usd ?? 0,
      period: t.period, description: t.description ?? '',
      benefits: t.benefits ?? [], is_active: t.is_active,
      is_featured: t.is_featured, sort_order: t.sort_order,
    })
    setBenefitInput('')
    setEditingTier(t)
  }
  function setTF(k: string, v: unknown) { setTierForm(p => ({ ...p, [k]: v })) }
  function addBenefit() {
    if (!benefitInput.trim()) return
    setTierForm(p => ({ ...p, benefits: [...p.benefits, benefitInput.trim()] }))
    setBenefitInput('')
  }
  function removeBenefit(i: number) {
    setTierForm(p => ({ ...p, benefits: p.benefits.filter((_, idx) => idx !== i) }))
  }

  async function saveTier(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSavingTier(true)
      const method = editingTier === 'new' ? 'POST' : 'PUT'
      const body = editingTier === 'new'
        ? tierForm
        : { id: (editingTier as MembershipTier).id, ...tierForm }

      const res = await fetch('/api/admin/membership/tiers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setSavingTier(false)
      setEditingTier(null)
      fetchAll()
    } catch (err) {
      console.error('Failed to save tier:', err)
      setSavingTier(false)
      setError(err instanceof Error ? err.message : 'Failed to save tier')
    }
  }

  async function handleDeleteTier() {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/membership/tiers?id=${deleteTarget!.id}`, {
        method: 'DELETE',
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setDeleting(false)
      setDeleteTarget(null)
      fetchAll()
    } catch (err) {
      console.error('Failed to delete tier:', err)
      setDeleting(false)
      setError(err instanceof Error ? err.message : 'Failed to delete tier')
    }
  }

  async function handleUpdateAppStatus(id: string, status: ApplicationStatus) {
    try {
      const res = await fetch('/api/admin/membership/applications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      fetchAll()
      if (selectedApp?.id === id) setSelectedApp(prev => prev ? { ...prev, status } : null)
    } catch (err) {
      console.error('Failed to update application status:', err)
      setError(err instanceof Error ? err.message : 'Failed to update application status')
    }
  }

  const filteredApps = appFilter === 'all' ? applications : applications.filter(a => a.status === appFilter)
  const pendingCount = applications.filter(a => a.status === 'pending').length

  if (loading) return <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>

  if (error) return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
      </div>
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
        <p className="font-semibold mb-2">Failed to load membership data</p>
        <p className="text-sm mb-4">{error}</p>
        <button onClick={fetchAll} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Try Again
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Membership</h1>
        <p className="text-gray-500 text-sm mt-1">Manage membership tiers and review applications.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['tiers', 'applications'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium capitalize transition-all flex items-center gap-2 ${tab === t ? 'bg-[#0a0f0d] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            {t === 'applications' && pendingCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">{pendingCount}</span>
            )}
            {t === 'tiers' ? 'Membership Tiers' : 'Applications'}
          </button>
        ))}
      </div>

      {/* TIERS TAB */}
      {tab === 'tiers' && (
        <div>
          <div className="flex justify-end mb-4">
            <button onClick={openNewTier} className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              Add Tier
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tiers.map(t => (
              <div key={t.id} className={`bg-white border-2 rounded-2xl p-5 hover:shadow-sm transition-shadow ${t.is_featured ? 'border-green-400' : 'border-gray-200'} ${!t.is_active ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">{t.name}</h3>
                    {t.is_featured && <span className="text-xs text-green-600 font-medium">★ Featured</span>}
                  </div>
                  <button onClick={() => openEditTier(t)} className="text-gray-400 hover:text-gray-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                  </button>
                </div>
                {(t.price_tzs || t.price_usd) && (
                  <div className="mb-3">
                    {t.price_tzs ? <p className="text-sm font-semibold text-gray-800">TZS {t.price_tzs.toLocaleString()} / {t.period}</p> : null}
                    {t.price_usd ? <p className="text-sm text-gray-500">${t.price_usd} USD</p> : null}
                  </div>
                )}
                {t.benefits && t.benefits.length > 0 && (
                  <ul className="space-y-1">
                    {t.benefits.slice(0, 3).map((b, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-green-500 mt-0.5">✓</span>{b}
                      </li>
                    ))}
                    {t.benefits.length > 3 && <li className="text-xs text-gray-400">+{t.benefits.length - 3} more…</li>}
                  </ul>
                )}
              </div>
            ))}
            {!tiers.length && (
              <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="text-4xl mb-3">🏷️</div>
                <p className="text-gray-500 text-sm">No membership tiers yet.</p>
                <button onClick={openNewTier} className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">+ Add Tier</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* APPLICATIONS TAB */}
      {tab === 'applications' && (
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['all', 'pending', 'approved', 'rejected', 'waitlisted'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setAppFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0 ${appFilter === f ? 'bg-[#0a0f0d] text-white' : 'bg-white border border-gray-200 text-gray-600'}`}
                >
                  {f === 'all' ? `All (${applications.length})` : `${f.charAt(0).toUpperCase() + f.slice(1)} (${applications.filter(a => a.status === f).length})`}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredApps.map(app => (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`bg-white border rounded-xl p-4 cursor-pointer hover:shadow-sm transition-all ${selectedApp?.id === app.id ? 'border-green-400 ring-1 ring-green-400' : 'border-gray-200'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{app.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{app.email}</p>
                      {app.vehicle_make && <p className="text-xs text-gray-400 mt-0.5">{app.vehicle_year} {app.vehicle_make} {app.vehicle_model}</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[app.status]}`}>{app.status}</span>
                      <span className="text-xs text-gray-400">{new Date(app.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}
              {!filteredApps.length && (
                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                  <p className="text-gray-400 text-sm">No applications found.</p>
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          {selectedApp && (
            <div className="w-80 flex-shrink-0 bg-white border border-gray-200 rounded-2xl p-5 self-start sticky top-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-gray-900">Application Details</h3>
                <button onClick={() => setSelectedApp(null)} className="text-gray-400 hover:text-gray-700">✕</button>
              </div>
              <div className="space-y-3 text-sm">
                <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Full Name</p><p className="text-gray-900 font-medium mt-0.5">{selectedApp.full_name}</p></div>
                <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Email</p><p className="text-gray-900 mt-0.5">{selectedApp.email}</p></div>
                {selectedApp.phone && <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Phone</p><p className="text-gray-900 mt-0.5">{selectedApp.phone}</p></div>}
                {selectedApp.vehicle_make && (
                  <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Vehicle</p><p className="text-gray-900 mt-0.5">{selectedApp.vehicle_year} {selectedApp.vehicle_make} {selectedApp.vehicle_model}</p></div>
                )}
                {selectedApp.message && <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Message</p><p className="text-gray-600 mt-0.5 text-xs leading-relaxed">{selectedApp.message}</p></div>}
                <div><p className="text-xs text-gray-400 font-medium uppercase tracking-widest">Submitted</p><p className="text-gray-900 mt-0.5">{new Date(selectedApp.created_at).toLocaleString()}</p></div>
              </div>
              <div className="mt-5 pt-5 border-t border-gray-100">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-widest mb-3">Update Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['approved', 'rejected', 'waitlisted', 'pending'] as ApplicationStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateAppStatus(selectedApp.id, s)}
                      className={`py-2 rounded-lg text-xs font-medium capitalize transition-all ${selectedApp.status === s ? statusColors[s] + ' ring-1 ring-current' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tier Edit Modal */}
      {editingTier && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editingTier === 'new' ? 'Add Tier' : 'Edit Tier'}</h2>
            <form onSubmit={saveTier} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Tier Name *</label>
                <input type="text" value={tierForm.name} onChange={e => setTF('name', e.target.value)} required placeholder="e.g. Full Member" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">TZS Price</label>
                  <input type="number" value={tierForm.price_tzs} onChange={e => setTF('price_tzs', parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">USD Price</label>
                  <input type="number" value={tierForm.price_usd} onChange={e => setTF('price_usd', parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Period</label>
                  <select value={tierForm.period} onChange={e => setTF('period', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-400 bg-white">
                    <option value="annual">Annual</option>
                    <option value="monthly">Monthly</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea value={tierForm.description} onChange={e => setTF('description', e.target.value)} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Benefits</label>
                <div className="space-y-2 mb-2">
                  {tierForm.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-green-500 text-sm">✓</span>
                      <span className="text-sm text-gray-700 flex-1">{b}</span>
                      <button type="button" onClick={() => removeBenefit(i)} className="text-gray-400 hover:text-red-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={benefitInput}
                    onChange={e => setBenefitInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                    placeholder="Add a benefit…"
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-green-400"
                  />
                  <button type="button" onClick={addBenefit} className="px-4 py-2.5 bg-green-500 text-white rounded-xl text-sm font-medium">Add</button>
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={tierForm.is_active} onChange={e => setTF('is_active', e.target.checked)} className="sr-only" />
                    <div className={`w-9 h-5 rounded-full transition-colors ${tierForm.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${tierForm.is_active ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="relative">
                    <input type="checkbox" checked={tierForm.is_featured} onChange={e => setTF('is_featured', e.target.checked)} className="sr-only" />
                    <div className={`w-9 h-5 rounded-full transition-colors ${tierForm.is_featured ? 'bg-green-500' : 'bg-gray-200'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform mt-0.5 ${tierForm.is_featured ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </div>
                  <span className="text-sm text-gray-700">Featured</span>
                </label>
              </div>
              <div className="flex items-center justify-between pt-2">
                {editingTier !== 'new' && <button type="button" onClick={() => { setEditingTier(null); setDeleteTarget(editingTier as MembershipTier) }} className="text-red-500 text-sm font-medium">Delete Tier</button>}
                <div className={`flex gap-3 ${editingTier === 'new' ? 'ml-auto' : ''}`}>
                  <button type="button" onClick={() => setEditingTier(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={savingTier} className="px-4 py-2 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium disabled:opacity-50">{savingTier ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmDelete title={deleteTarget.name} onConfirm={handleDeleteTier} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  )
}
