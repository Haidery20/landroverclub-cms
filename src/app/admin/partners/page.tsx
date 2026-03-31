'use client'
import { useState, useEffect } from 'react'
import { getPartners, createPartner, updatePartner, deletePartner } from '@/lib/db'
import { Partner, PartnerTier } from '@/lib/types'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const tierColors: Record<PartnerTier, string> = {
  platinum: 'bg-slate-100 text-slate-700',
  gold: 'bg-yellow-100 text-yellow-700',
  silver: 'bg-gray-100 text-gray-600',
  partner: 'bg-blue-100 text-blue-700',
}

const blankForm = { name: '', logo_url: '', website_url: '', tier: 'partner' as PartnerTier, description: '', is_active: true, sort_order: 0 }

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Partner | null | 'new'>(null)
  const [form, setForm] = useState(blankForm)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchPartners() }, [])

  async function fetchPartners() {
    const data = await getPartners()
    setPartners(data)
    setLoading(false)
  }

  function openNew() {
    setForm(blankForm)
    setEditing('new')
  }

  function openEdit(p: Partner) {
    setForm({ name: p.name, logo_url: p.logo_url ?? '', website_url: p.website_url ?? '', tier: p.tier, description: p.description ?? '', is_active: p.is_active, sort_order: p.sort_order })
    setEditing(p)
  }

  function set(key: string, value: unknown) { setForm(prev => ({ ...prev, [key]: value })) }

 async function handleSave(e: React.FormEvent) {
  e.preventDefault()
  setSaving(true)

  try {
    // Strip out any undefined values — Firestore rejects them
    const payload = Object.fromEntries(
      Object.entries({
        ...form,
        updated_at: new Date().toISOString(),
      }).filter(([, v]) => v !== undefined)
    ) as typeof form

    if (editing === 'new') {
      await createPartner(payload)
    } else {
      await updatePartner((editing as Partner).id, payload)
    }

    setEditing(null)
    fetchPartners()
  } catch (err) {
    console.error('❌ Save failed:', err)
    alert('Save failed: ' + (err instanceof Error ? err.message : String(err)))
  } finally {
    setSaving(false)
  }
}

  async function handleDelete() {
    setDeleting(true)
    await deletePartner(deleteTarget!.id)
    setDeleting(false)
    setDeleteTarget(null)
    fetchPartners()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Partners & Sponsors</h1>
          <p className="text-gray-500 text-sm mt-1">{partners.length} partners</p>
        </div>
        <button onClick={openNew} className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Partner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {partners.map(p => (
            <div key={p.id} className={`bg-white border rounded-2xl p-5 hover:shadow-sm transition-shadow ${!p.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                {p.logo_url
                  ? <img src={p.logo_url} alt={p.name} className="h-12 object-contain" />
                  : <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs font-bold">{p.name.slice(0, 2).toUpperCase()}</div>
                }
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${tierColors[p.tier]}`}>{p.tier}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{p.name}</h3>
              {p.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.description}</p>}
              <div className="flex items-center justify-between">
                {p.website_url ? <a href={p.website_url} target="_blank" className="text-xs text-blue-500 hover:underline truncate max-w-[140px]">{p.website_url}</a> : <span />}
                <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-gray-700 transition-colors ml-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                </button>
              </div>
            </div>
          ))}
          {!partners.length && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3">🤝</div>
              <p className="text-gray-500 text-sm">No partners yet.</p>
              <button onClick={openNew} className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">+ Add Partner</button>
            </div>
          )}
        </div>
      )}

      {/* Edit/New Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editing === 'new' ? 'Add Partner' : 'Edit Partner'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Name *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Partner name" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
              </div>
              <ImageUpload value={form.logo_url} onChange={url => set('logo_url', url)} bucket="partners" label="Logo" />
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Website</label>
                <input type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Tier</label>
                  <select value={form.tier} onChange={e => set('tier', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-400 bg-white">
                    <option value="platinum">Platinum</option>
                    <option value="gold">Gold</option>
                    <option value="silver">Silver</option>
                    <option value="partner">Partner</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Description</label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">Active / Visible</span>
              </label>
              <div className="flex items-center justify-between pt-2">
                {editing !== 'new' && <button type="button" onClick={() => { setEditing(null); setDeleteTarget(editing as Partner) }} className="text-red-500 text-sm font-medium">Delete</button>}
                <div className={`flex gap-3 ${editing === 'new' ? 'ml-auto' : ''}`}>
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDelete title={deleteTarget.name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
      )}
    </div>
  )
}
