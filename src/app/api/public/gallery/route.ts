import { NextResponse } from 'next/server'
import { getGallery } from '@/lib/db'

export async function GET() {
  try {
    const gallery = await getGallery()
    return NextResponse.json(gallery)
  } catch (error) {
    console.error('Failed to fetch gallery:', error)
    return NextResponse.json({ error: 'Failed to fetch gallery' }, { status: 500 })
  }
}
