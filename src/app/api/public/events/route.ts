import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/db'

export async function GET() {
  try {
    const events = await getEvents()
    // Filter to active events only for public display
    const activeEvents = events.filter(e => e.status !== 'cancelled')
    return NextResponse.json(activeEvents)
  } catch (error) {
    console.error('Failed to fetch events:', error)
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
