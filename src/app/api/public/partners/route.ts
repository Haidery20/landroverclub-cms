import { NextResponse } from 'next/server'
import { getPartners } from '@/lib/db'

export async function GET() {
  try {
    const partners = await getPartners()
    // Filter to active partners only for public display
    const activePartners = partners.filter(p => p.is_active)
    return NextResponse.json(activePartners)
  } catch (error) {
    console.error('Failed to fetch partners:', error)
    return NextResponse.json({ error: 'Failed to fetch partners' }, { status: 500 })
  }
}
