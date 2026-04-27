'use client'
import { exportEventRegistrationsPDF, exportEventRegistrationDetailPDF } from '@/lib/pdf-export'
import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, updateDoc, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { EventRegistration, RegistrationStatus } from '@/lib/types'

const statusColors: Record<RegistrationStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

// ── Small detail badge ─────────────────────────────────────────────────────────
function DetailBadge({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <span className="text-sm text-gray-800 font-medium">{value}</span>
    </div>
  )
}

// ── Expandable detail panel ────────────────────────────────────────────────────
function RegistrationDetail({ r }: { r: EventRegistration }) {
  const durationLabel = r.duration === 'one' ? 'One night' : r.duration === 'two' ? 'Two nights' : r.duration ?? '—'

  return (
    <tr>
      <td colSpan={6} className="px-0 pb-0">
        <div className="mx-4 mb-4 border border-gray-100 rounded-2xl overflow-hidden bg-gray-50">
          {/* Header strip */}
          <div className="bg-green-700 px-5 py-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-widest">Full Registration Details</span>
            <span className="text-xs text-green-200">{r.id}</span>
          </div>

          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-5">
            {/* ── Participant ─── */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">
                👤 Participant
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <DetailBadge label="Full Name" value={r.full_name} />
                <DetailBadge label="Email" value={r.email} />
                <DetailBadge label="Phone" value={r.phone} />
                <DetailBadge label="Vehicle" value={r.vehicle || 'Not specified'} />
              </div>
            </div>

            {/* ── Attendance ─── */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">
                📅 Attendance & Package
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <DetailBadge
                  label="Days Attending"
                  value={
                    Array.isArray(r.days_attending)
                      ? r.days_attending.join(', ')
                      : r.days_attending || '—'
                  }
                />
                <DetailBadge label="Duration" value={durationLabel} />
                <DetailBadge
                  label="People Count"
                  value={r.people_count ? `${r.people_count} ${Number(r.people_count) === 1 ? 'person' : 'people'}` : '—'}
                />
                <DetailBadge
                  label="Package Price"
                  value={r.package_price ? `TZS ${r.package_price}` : '—'}
                />
              </div>
            </div>

            {/* ── Accommodation ─── */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">
                ⛺ Accommodation
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <DetailBadge label="Type" value={r.accommodation_type || '—'} />
                <DetailBadge label="Nights" value={r.accommodation_nights || '—'} />
              </div>
            </div>

            {/* ── Payment ─── */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-4">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">
                💳 Payment
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                <DetailBadge label="Method" value={r.payment_method || '—'} />
                <DetailBadge label="Status" value={r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : '—'} />
              </div>
            </div>

            {/* ── Extra ─── */}
            {(r.emergency_contact || r.comments || r.message) && (
              <div className="col-span-2 sm:col-span-3 lg:col-span-4">
                <p className="text-[10px] font-bold text-green-700 uppercase tracking-widest mb-3 border-b border-green-100 pb-1">
                  🔔 Additional Info
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                  <DetailBadge label="Emergency Contact" value={r.emergency_contact || '—'} />
                  {(r.comments || r.message) && (
                    <div className="flex flex-col gap-0.5 sm:col-span-2">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Comments / Notes</span>
                      <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 leading-relaxed">
                        {r.comments || r.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [filterEvent, setFilterEvent] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

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

  async function handleDownload(r: EventRegistration) {
    setDownloadingId(r.id)
    try {
      await exportEventRegistrationDetailPDF(r)
    } finally {
      setDownloadingId(null)
    }
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

      {/* Filters + Export */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterEvent}
          onChange={e => setFilterEvent(e.target.value)}
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:border-green-400"
        >
          {eventTitles.map(t => <option key={t} value={t}>{t}</option>)}
        </select>

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

        <button
          onClick={() => exportEventRegistrationsPDF(filtered, filterEvent, filterStatus)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export All PDF
        </button>
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
                  <th className="w-8 px-4 py-4" />
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
                  <>
                    <tr
                      key={r.id}
                      className={`hover:bg-gray-50 transition-colors cursor-pointer ${expandedId === r.id ? 'bg-green-50/40' : ''}`}
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      {/* Expand chevron */}
                      <td className="pl-4 pr-0 py-4">
                        <svg
                          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${expandedId === r.id ? 'rotate-90 text-green-600' : ''}`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-semibold text-gray-900">{r.full_name}</p>
                        {r.vehicle && <p className="text-xs text-gray-400 mt-0.5">🚗 {r.vehicle}</p>}
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm text-gray-700">{r.email}</p>
                        {r.phone && <p className="text-xs text-gray-400">{r.phone}</p>}
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <p className="text-sm font-medium text-gray-900 max-w-[180px] truncate">{r.event_title}</p>
                        <p className="text-xs text-gray-400">{new Date(r.event_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <p className="text-xs text-gray-500">{formatDate(r.registered_at)}</p>
                      </td>

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
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

                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownload(r)}
                            disabled={downloadingId === r.id}
                            title="Download PDF"
                            className="text-gray-400 hover:text-green-600 transition-colors disabled:opacity-40"
                          >
                            {downloadingId === r.id ? (
                              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                              </svg>
                            )}
                          </button>

                          <button
                            onClick={() => deleteRegistration(r.id)}
                            title="Delete"
                            className="text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* ── Expanded detail row ── */}
                    {expandedId === r.id && <RegistrationDetail key={`${r.id}-detail`} r={r} />}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}