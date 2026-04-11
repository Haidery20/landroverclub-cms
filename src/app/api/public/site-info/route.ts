import { NextResponse } from 'next/server'
import { getSiteInfo } from '@/lib/db'

export async function GET() {
  try {
    const infoRows = await getSiteInfo()
    
    // Reshape into a nested object for easier client consumption
    const siteInfo: Record<string, Record<string, string>> = {}
    infoRows.forEach((row) => {
      if (!siteInfo[row.section]) {
        siteInfo[row.section] = {}
      }
      siteInfo[row.section][row.key] = row.value ?? ''
    })
    
    return NextResponse.json(siteInfo)
  } catch (error) {
    console.error('Failed to fetch site info:', error)
    return NextResponse.json({ error: 'Failed to fetch site info' }, { status: 500 })
  }
}
