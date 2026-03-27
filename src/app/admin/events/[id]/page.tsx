import { getEvent } from '@/lib/db'
import EventForm from '@/components/admin/EventForm'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await getEvent(id)
  if (!event) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/admin/events" className="text-gray-400 hover:text-gray-700 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
      </div>
      <EventForm event={event} />
    </div>
  )
}
