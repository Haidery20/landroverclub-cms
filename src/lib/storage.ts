import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from './firebase'

/**
 * Upload a file to Firebase Storage and return its public download URL.
 * Mirrors the Supabase uploadImage(file, bucket, folder?) signature so
 * every call-site only needs to change the import path.
 */
export async function uploadImage(
  file: File,
  bucket: string,
  folder?: string
): Promise<string | null> {
  try {
    const ext = file.name.split('.').pop()
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = folder ? `${bucket}/${folder}/${name}` : `${bucket}/${name}`

    const storageRef = ref(storage, path)
    const snap = await uploadBytes(storageRef, file)
    const url = await getDownloadURL(snap.ref)
    return url
  } catch (err) {
    console.error('Upload error:', err)
    return null
  }
}

/**
 * Delete a file from Firebase Storage using its full download URL.
 */
export async function deleteImage(_bucket: string, url: string): Promise<void> {
  try {
    const match = url.match(/\/o\/(.+?)\?/)
    if (!match) return
    const path = decodeURIComponent(match[1])
    const fileRef = ref(storage, path)
    await deleteObject(fileRef)
  } catch (err) {
    console.error('Delete error:', err)
  }
}
