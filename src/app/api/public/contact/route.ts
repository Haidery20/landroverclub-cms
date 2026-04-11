import { NextResponse } from 'next/server'
import { getContactDetails } from '@/lib/db'

export async function GET() {
  try {
    const details = await getContactDetails()
    // Filter to active contact details only for public display
    const activeDetails = details.filter(d => d.is_active)
    return NextResponse.json(activeDetails)
  } catch (error) {
    console.error('Failed to fetch contact details:', error)
    return NextResponse.json({ error: 'Failed to fetch contact details' }, { status: 500 })
  }
}
