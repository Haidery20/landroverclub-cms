import { NextRequest, NextResponse } from 'next/server'
import { getSiteInfo, upsertSiteInfo } from '@/lib/db'

export async function GET() {
  try {
    const data = await getSiteInfo()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Failed to fetch site info:', error)
    return NextResponse.json({ error: 'Failed to fetch site info' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { section, key, value } = await req.json()
    if (!section || !key) return NextResponse.json({ error: 'Missing section or key' }, { status: 400 })
    
    await upsertSiteInfo(section, key, value ?? '')
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Failed to upsert site info:', error)
    return NextResponse.json({ error: 'Failed to upsert site info' }, { status: 500 })
  }
}
