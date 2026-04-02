import { NextRequest, NextResponse } from 'next/server'
import { getMembershipTiers, createMembershipTier, updateMembershipTier, deleteMembershipTier } from '@/lib/db'
import type { MembershipTier } from '@/lib/types'

export async function GET() {
  try {
    const tiers = await getMembershipTiers()
    return NextResponse.json(tiers)
  } catch (error) {
    console.error('Failed to fetch tiers:', error)
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const id = await createMembershipTier(data)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create tier:', error)
    return NextResponse.json({ error: 'Failed to create tier' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing tier id' }, { status: 400 })
    
    await updateMembershipTier(id, data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to update tier:', error)
    return NextResponse.json({ error: 'Failed to update tier' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing tier id' }, { status: 400 })
    
    await deleteMembershipTier(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete tier:', error)
    return NextResponse.json({ error: 'Failed to delete tier' }, { status: 500 })
  }
}
