'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { EventRegistration, RegistrationStatus } from '@/lib/types'

const statusColors: Record<RegistrationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')

  useEffect(() => { fetchRegistrations() }, [])

  async function fetchRegistrations() {
    const q = query(collection(db, 'event_registrations'), orderBy('registered_at', 'desc'))
    const snap = await getDocs(q)
    setRegistrations(snap.docs.map(d => ({ id: d.id, ...d.data() } as EventRegistration)))
    setLoading(false)
  }

  async function updateStatus(id: string, status: RegistrationStatus) {
    await updateDoc(doc(db, 'event_registrations', id), { status })
    fetchRegistrations()
  }

  async function deleteRegistration(id: string) {
    if (!confirm('Delete this registration?')) return
    await deleteDoc(doc(db, 'event_registrations', id))
    fetchRegistrations()
  }

  const eventTitles = ['All', ...Array.from(new Set(registrations.map(r => r.event_title)))]

  const filtered = registrations.filter(r => {
    if (filterEvent !== 'All' && r.event_title !== filterEvent) return false
    if (filterStatus !== 'All' && r.status !== filterStatus) return false
    return true
  })

  const formatDate = (str: string) => new Date(str).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Event Registrations</h1>
          <p className="text-gray-500 text-sm mt-1">{filtered.length} registrations</p>
        </div>
        <button
          onClick={fetchRegistrations}
          className="border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div>
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-green-400"
          >
            {eventTitles.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-green-400"
          >
            <option value="All">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">📋</div>
          <p className="text-gray-500 text-sm">No registrations yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">Name</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">Contact</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">Event</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">Registered</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-widest px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{r.full_name}</p>
                      {r.message && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">"{r.message}"</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700">{r.email}</p>
                      {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{r.event_title}</p>
                      <p className="text-xs text-gray-400">{new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs text-gray-500">{formatDate(r.registered_at)}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={r.status}
                        onChange={e => updateStatus(r.id, e.target.value as RegistrationStatus)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 focus:outline-none cursor-pointer ${statusColors[r.status]}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => deleteRegistration(r.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}