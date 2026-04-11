import { NextRequest, NextResponse } from 'next/server'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const bucket = (formData.get('bucket') as string) || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10MB' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only images and PDF/Word documents are allowed' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: `landroverclub/${bucket}`,
          resource_type: isImage ? 'image' : 'raw',
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve(result as { secure_url: string })
        }
      ).end(buffer)
    })

    return NextResponse.json({ url: result.secure_url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    console.error('❌ Upload error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}