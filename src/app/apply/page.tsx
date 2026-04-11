'use client'
import { useState, useRef } from 'react'
import { createMembershipApplication } from '@/lib/db'

type FormData = {
  full_name: string
  email: string
  phone: string
  vehicle_make: string
  vehicle_model: string
  vehicle_year: string
  tier_id: string
  message: string
}

const blank: FormData = {
  full_name: '', email: '', phone: '',
  vehicle_make: '', vehicle_model: '', vehicle_year: '',
  tier_id: '', message: '',
}

export default function ApplyPage() {
  const [form, setForm] = useState<FormData>(blank)
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function set(k: keyof FormData, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    const valid = selected.filter(f => f.size <= 10 * 1024 * 1024)
    if (valid.length < selected.length) {
      setError('Some files were skipped (max 10MB each)')
    }
    setFiles(prev => [...prev, ...valid].slice(0, 5))
  }

  function removeFile(i: number) {
    setFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  async function uploadFiles(files: File[]): Promise<string[]> {
    const urls: string[] = []
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'membership/attachments')
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) urls.push(data.url)
    }
    return urls
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setError(null)
  setUploading(true)

  try {
    let attachment_urls: string[] = []
    if (files.length > 0) {
      attachment_urls = await uploadFiles(files)
      console.log('✅ Uploaded URLs:', attachment_urls)  // ← added
    }
    console.log('📝 Saving with attachment_urls:', attachment_urls)  // ← added
    await createMembershipApplication({
      ...form,
      attachment_urls,
      status: 'pending',
    })
    setSubmitted(true)
  } catch (err) {
    console.error('❌ Submit error:', err)  // ← added
    setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
  } finally {
    setUploading(false)
  }
}

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f4ef] flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} className="w-10 h-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Application Submitted!</h1>
          <p className="text-gray-600 mb-2">Thank you, <strong>{form.full_name}</strong>.</p>
          <p className="text-gray-500 text-sm">We've received your membership application and will be in touch at <strong>{form.email}</strong> shortly.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f4ef]">
      {/* Header */}
      <div className="bg-[#0a0f0d] text-white px-6 py-5 flex items-center gap-4">
        <div className="w-10 h-10 flex-shrink-0">
          <img src="/lrct.svg" alt="LRCT" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight">Land Rover Club Tanzania</h1>
          <p className="text-gray-400 text-sm">Membership Application</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Join the Club</h2>
          <p className="text-gray-500 mt-1 text-sm">Fill in the form below and we'll review your application. Fields marked * are required.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Personal Information</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Full Name *</label>
              <input
                type="text" value={form.full_name} onChange={e => set('full_name', e.target.value)}
                required placeholder="Your full name"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Email *</label>
                <input
                  type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  required placeholder="you@example.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Phone</label>
                <input
                  type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+255 7xx xxx xxx"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Vehicle Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Make</label>
                <input
                  type="text" value={form.vehicle_make} onChange={e => set('vehicle_make', e.target.value)}
                  placeholder="Land Rover"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Model</label>
                <input
                  type="text" value={form.vehicle_model} onChange={e => set('vehicle_model', e.target.value)}
                  placeholder="Defender 110"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Year</label>
                <input
                  type="text" value={form.vehicle_year} onChange={e => set('vehicle_year', e.target.value)}
                  placeholder="2019"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Additional Information</h3>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Message / Why do you want to join?</label>
              <textarea
                value={form.message} onChange={e => set('message', e.target.value)}
                rows={4} placeholder="Tell us a bit about yourself and your interest in the club…"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-widest">Attachments</h3>
              <p className="text-xs text-gray-400 mt-1">Upload supporting documents (vehicle registration, ID copy, photos). Images or PDFs, max 10MB each, up to 5 files.</p>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <span className="text-lg">{f.type.startsWith('image/') ? '🖼️' : '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{f.name}</p>
                      <p className="text-xs text-gray-400">{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" onClick={() => removeFile(i)} className="text-gray-400 hover:text-red-500 transition-colors text-sm">✕</button>
                  </div>
                ))}
              </div>
            )}

            {files.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 rounded-xl py-6 text-sm text-gray-400 hover:border-green-400 hover:text-green-600 transition-colors flex flex-col items-center gap-2"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                Click to upload files
              </button>
            )}
            <input
              ref={fileInputRef} type="file" multiple
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFiles} className="hidden"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
          )}

          <button
            type="submit" disabled={uploading}
            className="w-full bg-[#0a0f0d] text-white py-4 rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting…
              </>
            ) : 'Submit Application'}
          </button>
        </form>
      </div>
    </div>
  )
}