'use client'
import { useState, useEffect } from 'react'
import { getCommitteeMembers, createCommitteeMember, updateCommitteeMember, deleteCommitteeMember } from '@/lib/db'
import { CommitteeMember } from '@/lib/types'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

const blank = { full_name: '', position: '', bio: '', photo_url: '', email: '', phone: '', sort_order: 0, is_active: true }

export default function CommitteePage() {
  const [members, setMembers] = useState<CommitteeMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<CommitteeMember | 'new' | null>(null)
  const [form, setForm] = useState(blank)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CommitteeMember | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await getCommitteeMembers()
    setMembers(data)
    setLoading(false)
  }

  function openNew() { setForm(blank); setEditing('new') }
  function openEdit(m: CommitteeMember) {
    setForm({ full_name: m.full_name, position: m.position, bio: m.bio ?? '', photo_url: m.photo_url ?? '', email: m.email ?? '', phone: m.phone ?? '', sort_order: m.sort_order, is_active: m.is_active })
    setEditing(m)
  }
  function set(k: string, v: unknown) { setForm(p => ({ ...p, [k]: v })) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    if (editing === 'new') {
      await createCommitteeMember(form)
    } else {
      await updateCommitteeMember((editing as CommitteeMember).id, form)
    }
    setSaving(false)
    setEditing(null)
    load()
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteCommitteeMember(deleteTarget!.id)
    setDeleting(false)
    setDeleteTarget(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Committee Members</h1>
          <p className="text-gray-500 text-sm mt-1">{members.filter(m => m.is_active).length} active members</p>
        </div>
        <button onClick={openNew} className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Member
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className={`bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-sm transition-shadow ${!m.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-4">
                {m.photo_url ? (
                  <img src={m.photo_url} alt={m.full_name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-lg">
                    {m.full_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{m.full_name}</h3>
                  <p className="text-sm text-green-600 font-medium truncate">{m.position}</p>
                  {m.email && <p className="text-xs text-gray-400 truncate mt-1">{m.email}</p>}
                </div>
                <button onClick={() => openEdit(m)} className="text-gray-400 hover:text-gray-700 flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                </button>
              </div>
              {m.bio && <p className="text-xs text-gray-500 mt-3 line-clamp-2">{m.bio}</p>}
            </div>
          ))}
          {!members.length && (
            <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-500 text-sm">No committee members yet.</p>
              <button onClick={openNew} className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">+ Add Member</button>
            </div>
          )}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-5">{editing === 'new' ? 'Add Member' : 'Edit Member'}</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <ImageUpload value={form.photo_url} onChange={url => set('photo_url', url)} bucket="committee" label="Photo" />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
                  <input type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Position *</label>
                  <input type="text" value={form.position} onChange={e => set('position', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                  <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Bio</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={3} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Sort Order</label>
                  <input type="number" value={form.sort_order} onChange={e => set('sort_order', parseInt(e.target.value))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                      <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="sr-only" />
                      <div className={`w-11 h-6 rounded-full transition-colors ${form.is_active ? 'bg-green-500' : 'bg-gray-200'}`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_active ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>
                    <span className="text-sm text-gray-700">Active</span>
                  </label>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2">
                {editing !== 'new' && <button type="button" onClick={() => { setEditing(null); setDeleteTarget(editing as CommitteeMember) }} className="text-red-500 text-sm font-medium">Delete</button>}
                <div className={`flex gap-3 ${editing === 'new' ? 'ml-auto' : ''}`}>
                  <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmDelete title={deleteTarget.full_name} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  )
}
