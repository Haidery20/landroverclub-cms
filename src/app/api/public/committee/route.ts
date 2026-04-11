import { NextResponse } from 'next/server'
import { getCommitteeMembers } from '@/lib/db'

export async function GET() {
  try {
    const members = await getCommitteeMembers()
    // Filter to active members only for public display
    const activeMembers = members.filter(m => m.is_active)
    return NextResponse.json(activeMembers)
  } catch (error) {
    console.error('Failed to fetch committee members:', error)
    return NextResponse.json({ error: 'Failed to fetch committee members' }, { status: 500 })
  }
}
