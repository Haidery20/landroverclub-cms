'use client'
import { useState, useRef } from 'react'
import { uploadImage } from '@/lib/storage'
import Image from 'next/image'

interface ImageUploadProps {
  value?: string
  onChange: (url: string) => void
  bucket: string
  label?: string
}

export default function ImageUpload({ value, onChange, bucket, label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Client-side validation
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc)')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', bucket)

      console.log('📤 Sending upload request...', { fileName: file.name, size: file.size, bucket })
      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      console.log('📨 Response received:', { status: response.status, statusText: response.statusText })
      
      const data = await response.json()
      console.log('📄 Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (data.url) {
        console.log('✅ Upload successful:', data.url)
        onChange(data.url)
        setError('')
      } else {
        throw new Error('No URL returned from server')
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error'
      console.error('❌ Upload failed:', errorMsg)
      setError(`Upload failed: ${errorMsg}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">{label}</label>

      {value ? (
        <div className="relative group w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <Image src={value} alt="Preview" fill className="object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="bg-white text-gray-800 text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => onChange('')}
              className="bg-red-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-green-400 hover:bg-green-50 transition-all text-gray-400 hover:text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="w-5 h-5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-600">Uploading…<br/>This may take a minute</span>
            </>
          ) : (
            <>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <span className="text-xs font-medium">Click to upload {label.toLowerCase()}</span>
              <span className="text-xs opacity-60">PNG, JPG up to 5MB</span>
            </>
          )}
        </button>
      )}

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-xs font-medium">Upload Error</p>
          <p className="text-red-600 text-xs mt-1">{error}</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}
