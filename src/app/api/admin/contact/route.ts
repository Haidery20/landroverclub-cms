import { NextRequest, NextResponse } from 'next/server'
import { getContactDetails, createContactDetail, updateContactDetail, deleteContactDetail } from '@/lib/db'
import type { ContactDetail } from '@/lib/types'

export async function GET() {
  try {
    const details = await getContactDetails()
    return NextResponse.json(details)
  } catch (error) {
    console.error('Failed to fetch contact details:', error)
    return NextResponse.json({ error: 'Failed to fetch contact details' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const id = await createContactDetail(data)
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to create contact detail:', error)
    return NextResponse.json({ error: 'Failed to create contact detail' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'Missing detail id' }, { status: 400 })
    
    await updateContactDetail(id, data)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to update contact detail:', error)
    return NextResponse.json({ error: 'Failed to update contact detail' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing detail id' }, { status: 400 })
    
    await deleteContactDetail(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to delete contact detail:', error)
    return NextResponse.json({ error: 'Failed to delete contact detail' }, { status: 500 })
  }
}
