import Link from 'next/link'
import { getEvents } from '@/lib/db'
import { Event } from '@/lib/types'

const statusColor: Record<string, string> = {
  upcoming: 'bg-green-100 text-green-700',
  ongoing: 'bg-blue-100 text-blue-700',
  past: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-600',
}

export default async function EventsPage() {
  const events = await getEvents()

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm mt-1">{events.length} total events</p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Add Event
        </Link>
      </div>

      <div className="space-y-3">
        {events.map((event: Event) => (
          <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
            {event.image_url && (
              <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 truncate">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(event.event_date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {event.event_time && ` · ${event.event_time}`}
                    {event.location && ` · ${event.location}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColor[event.status]}`}>
                    {event.status}
                  </span>
                  {event.is_featured && (
                    <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-100 text-yellow-700">
                      Featured
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link
              href={`/admin/events/${event.id}`}
              className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
              </svg>
            </Link>
          </div>
        ))}

        {!events.length && (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-gray-500 text-sm">No events yet. Add your first event.</p>
            <Link href="/admin/events/new" className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">
              + Add Event
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
