'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, updateEvent, deleteEvent } from '@/lib/db'
import { Event, EventStatus } from '@/lib/types'
import ImageUpload from '@/components/admin/ImageUpload'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

interface EventFormProps {
  event?: Event
}

const defaultForm = {
  title: '',
  description: '',
  location: '',
  event_date: '',
  event_time: '',
  image_url: '',
  is_featured: false,
  status: 'upcoming' as EventStatus,
}

export default function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const [form, setForm] = useState(event ? {
    title: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    event_date: event.event_date,
    event_time: event.event_time ?? '',
    image_url: event.image_url ?? '',
    is_featured: event.is_featured,
    status: event.status,
  } : defaultForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [error, setError] = useState('')

  function set(key: string, value: unknown) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (event) {
        await updateEvent(event.id, form)
      } else {
        await createEvent(form)
      }
      router.push('/admin/events')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteEvent(event!.id)
    router.push('/admin/events')
    router.refresh()
  }

  return (
    <>
      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Event Details</h2>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Title *</label>
            <input type="text" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="e.g. Annual Safari Rally 2025" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Date *</label>
              <input type="date" value={form.event_date} onChange={e => set('event_date', e.target.value)} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Time</label>
              <input type="text" value={form.event_time} onChange={e => set('event_time', e.target.value)} placeholder="e.g. 8:00 AM" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Location</label>
            <input type="text" value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g. Mikumi National Park, Tanzania" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Event details, schedule, requirements…" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors resize-none" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Status</label>
              <select value={form.status} onChange={e => set('status', e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-green-400 transition-colors bg-white">
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="past">Past</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-colors ${form.is_featured ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${form.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">Feature on homepage</span>
              </label>
            </div>
          </div>

          <ImageUpload value={form.image_url} onChange={url => set('image_url', url)} bucket="events" label="Event Image" />
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}

        <div className="flex items-center justify-between">
          {event && (
            <button type="button" onClick={() => setShowDelete(true)} className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">
              Delete Event
            </button>
          )}
          <div className={`flex gap-3 ${!event ? 'ml-auto' : ''}`}>
            <button type="button" onClick={() => router.back()} className="px-5 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              {saving ? 'Saving…' : event ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </div>
      </form>

      {showDelete && <ConfirmDelete title="this event" onConfirm={handleDelete} onCancel={() => setShowDelete(false)} loading={deleting} />}
    </>
  )
}
