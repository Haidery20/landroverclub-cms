import { NextRequest, NextResponse } from 'next/server'
import { getMembershipApplications, updateApplicationStatus, deleteMembershipApplication } from '@/lib/db'
import type { ApplicationStatus } from '@/lib/types'

export async function GET() {
  try {
    const apps = await getMembershipApplications()
    return NextResponse.json(apps)
  } catch (error) {
    console.error('Failed to fetch applications:', error)
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, status } = await req.json()
    if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
    
    await updateApplicationStatus(id, status as ApplicationStatus)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to update application:', error)
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing application id' }, { status: 400 })
    
    await deleteMembershipApplication(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete application:', error)
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 })
  }
}
