'use client'
import { useState, useEffect } from 'react'
import { ContactDetail, ContactType } from '@/lib/types'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const typeIcons: Record<ContactType, string> = {
  email: '✉️', phone: '📞', address: '📍', social: '🔗', text: '📝', map_link: '🗺️'
}

const blank = { label: '', value: '', type: 'text' as ContactType, icon: '', is_active: true, sort_order: 0 }

export default function ContactPage() {
  const [contacts, setContacts] = useState<ContactDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<ContactDetail | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ContactDetail | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    try {
      setError(null)
      setLoading(true)
      const res = await fetch('/api/admin/contact')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setContacts(data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch contact details:', err)
      setError(err instanceof Error ? err.message : 'Failed to load contact details')
      setLoading(false)
    }
  }

  function openNew() { setForm(blank); setEditing('new') }
  function openEdit(c: ContactDetail) {
    setForm({ label: c.label, value: c.value, type: c.type, icon: c.icon ?? '', is_active: c.is_active, sort_order: c.sort_order })
    setEditing(c)
  }
  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      setSaving(true)
      const payload = { ...form, updated_at: new Date().toISOString() }
      const method = editing === 'new' ? 'POST' : 'PUT'
      const body = editing === 'new' ? payload : { id: (editing as ContactDetail).id, ...payload }
      
      const res = await fetch('/api/admin/contact', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setSaving(false)
      setEditing(null)
      fetchData()
    } catch (err) {
      console.error('Failed to save contact detail:', err)
      setSaving(false)
      setError(err instanceof Error ? err.message : 'Failed to save contact detail')
    }
  }

  async function handleDelete() {
    try {
      setDeleting(true)
      const res = await fetch(`/api/admin/contact?id=${deleteTarget!.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setDeleting(false)
      setDeleteTarget(null)
      fetchData()
    } catch (err) {
      console.error('Failed to delete contact detail:', err)
      setDeleting(false)
      setError(err instanceof Error ? err.message : 'Failed to delete contact detail')
    }
  }

  async function toggleActive(c: ContactDetail) {
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, is_active: !c.is_active }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      fetchData()
    } catch (err) {
      console.error('Failed to toggle active:', err)
      setError(err instanceof Error ? err.message : 'Failed to update contact')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Contact Details</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
          <p className="font-semibold mb-2">Failed to load contact details</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Details</h1>
          <p className="text-gray-500 text-sm mt-1">Manage contact info shown on your website.</p>
        </div>
        <button onClick={openNew} className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Contact
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {contacts.map(c => (
            <div key={c.id} className={`bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4 ${!c.is_active ? 'opacity-50' : ''}`}>
              <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-xl flex-shrink-0">
                {c.icon || typeIcons[c.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{c.label}</p>
                <p className="text-sm font-medium text-gray-900 truncate mt-0.5">{c.value}</p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full capitalize flex-shrink-0">{c.type}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(c)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${c.is_active ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {c.is_active ? 'Active' : 'Hidden'}
                </button>
                <button onClick={() => openEdit(c)} className="text-gray-400 hover:text-gray-700 transition-colors p-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                </button>
                <button onClick={() => setDeleteTarget(c)} className="text-gray-400 hover:text-red-500 transition-colors p-1.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                </button>
              </div>
            </div>
          ))}
          {!contacts.length && (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3">📞</div>
              <p className="text-gray-500 text-sm">No contact details yet.</p>
              <button onClick={openNew} className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">+ Add Contact</button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editing === 'new' ? 'Add Contact Detail' : 'Edit Contact Detail'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Label *</label>
                  <input type="text" value={form.label} onChange={e => set('label', e.target.value)} required placeholder="e.g. Main Email" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Type</label>
                  <select value={form.type} onChange={e => set('type', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-green-400 bg-white">
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="address">Address</option>
                    <option value="social">Social Media</option>
                    <option value="map_link">Map Link</option>
                    <option value="text">Text</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Value *</label>
                <input type="text" value={form.value} onChange={e => set('value', e.target.value)} required placeholder="e.g. info@landroverclub.or.tz" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Icon (emoji)</label>
                  <input type="text" value={form.icon} onChange={e => set('icon', e.target.value)} placeholder="e.g. 📧" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">Visible on website</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmDelete title={deleteTarget.label} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  )
}
