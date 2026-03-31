/**
 * Client-side upload helper — sends files to our Next.js API route
 * which then uploads to Cloudinary server-side.
 * Mirrors the old Firebase uploadImage(file, bucket, folder?) signature
 * so no call-sites need to change.
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder?: string
): Promise<string | null> {
  try {
    if (file.size > 5 * 1024 * 1024) {
      console.error('Upload failed: File too large (max 5MB)')
      return null
    }

    if (!file.type.startsWith('image/')) {
      console.error('Upload failed: Not an image file')
      return null
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', folder ? `${bucket}/${folder}` : bucket)

    console.log('🚀 Uploading via Cloudinary...', { name: file.name, size: file.size })

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Upload failed:', data.error)
      return null
    }

    console.log('✅ Upload successful:', data.url)
    return data.url ?? null
  } catch (err) {
    console.error('❌ Upload error:', err)
    return null
  }
}

/**
 * Delete an image by its Cloudinary URL.
 * Extracts the public_id from the URL and calls the delete API.
 */
export async function deleteImage(_bucket: string, url: string): Promise<void> {
  try {
    // Extract public_id from Cloudinary URL
    // e.g. https://res.cloudinary.com/demo/image/upload/v123/landroverclub/events/abc.jpg
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i)
    if (!match) return

    await fetch('/api/admin/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId: match[1] }),
    })
  } catch (err) {
    console.error('Delete error:', err)
  }
}