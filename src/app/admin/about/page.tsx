'use client'
import { getSiteInfo, upsertSiteInfo } from '@/lib/db'
import { useState, useEffect } from 'react'
import { SiteInfo } from '@/lib/types'

const SECTIONS = [
  {
    key: 'hero',
    label: 'Hero Section',
    icon: '🏠',
    fields: [
      { key: 'headline', label: 'Main Headline', type: 'text', placeholder: "Tanzania's Premier Land Rover Club" },
      { key: 'subheadline', label: 'Sub Headline', type: 'text', placeholder: 'Connecting off-road enthusiasts…' },
    ]
  },
  {
    key: 'about',
    label: 'About Page',
    icon: '📖',
    fields: [
      { key: 'title', label: 'Section Title', type: 'text', placeholder: 'About Land Rover Club Tanzania' },
      { key: 'body', label: 'Main Body Text', type: 'textarea', placeholder: 'The Land Rover Club of Tanzania…' },
      { key: 'mission', label: 'Mission Statement', type: 'textarea', placeholder: 'Our mission is to…' },
      { key: 'founded_year', label: 'Founded Year', type: 'text', placeholder: '1975' },
      { key: 'member_count', label: 'Member Count', type: 'text', placeholder: '250+' },
    ]
  },
  {
    key: 'seo',
    label: 'SEO & Metadata',
    icon: '🔍',
    fields: [
      { key: 'meta_title', label: 'Page Title', type: 'text', placeholder: 'Land Rover Club Tanzania' },
      { key: 'meta_description', label: 'Meta Description', type: 'textarea', placeholder: 'Official website of the Land Rover Club of Tanzania…' },
      { key: 'og_image_url', label: 'OG Image URL', type: 'text', placeholder: 'https://…' },
    ]
  },
  {
    key: 'footer',
    label: 'Footer',
    icon: '📄',
    fields: [
      { key: 'copyright_text', label: 'Copyright Text', type: 'text', placeholder: '© 2025 Land Rover Club Tanzania' },
      { key: 'tagline', label: 'Footer Tagline', type: 'text', placeholder: 'Explore. Connect. Conquer.' },
    ]
  },
]

type SiteInfoMap = Record<string, Record<string, string>>

export default function AboutPage() {
  const [data, setData] = useState<SiteInfoMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('hero')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
  try {
    setError(null)
    setLoading(true)
    const rows = await getSiteInfo()
    const map: SiteInfoMap = {}
    rows.forEach((row) => {
      if (!map[row.section]) map[row.section] = {}
      map[row.section][row.key] = row.value ?? ''
    })
    setData(map)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to load')
  } finally {
    setLoading(false)
  }
}

  function setValue(section: string, key: string, value: string) {
    setData(prev => ({
      ...prev,
      [section]: { ...(prev[section] ?? {}), [key]: value }
    }))
  }

  async function saveSection(sectionKey: string) {
  try {
    setSaving(sectionKey)
    const section = SECTIONS.find(s => s.key === sectionKey)!
    const values = data[sectionKey] ?? {}
    await Promise.all(
      section.fields.map(field =>
        upsertSiteInfo(sectionKey, field.key, values[field.key] ?? '')
      )
    )
    setSaved(sectionKey)
    setTimeout(() => setSaved(null), 2500)
    fetchData()
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to save')
  } finally {
    setSaving(null)
  }
}


  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">About & Site Info</h1>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
          <p className="font-semibold mb-2">Failed to load site info</p>
          <p className="text-sm mb-4">{error}</p>
          <button onClick={fetchData} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  const currentSection = SECTIONS.find(s => s.key === activeSection)!
  const values = data[activeSection] ?? {}

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">About & Site Info</h1>
        <p className="text-gray-500 text-sm mt-1">Edit the content displayed across your website.</p>
      </div>

      <div className="flex gap-6">
        {/* Section tabs */}
        <div className="w-48 flex-shrink-0 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                activeSection === s.key
                  ? 'bg-[#0a0f0d] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{currentSection.icon}</span>
              <h2 className="text-lg font-bold text-gray-900">{currentSection.label}</h2>
            </div>
            <button
              onClick={() => saveSection(activeSection)}
              disabled={saving === activeSection}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                saved === activeSection
                  ? 'bg-green-500 text-white'
                  : 'bg-[#0a0f0d] text-white hover:bg-gray-800 disabled:opacity-50'
              }`}
            >
              {saving === activeSection ? 'Saving…' : saved === activeSection ? '✓ Saved!' : 'Save Changes'}
            </button>
          </div>

          <div className="space-y-5">
            {currentSection.fields.map(field => (
              <div key={field.key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={values[field.key] ?? ''}
                    onChange={e => setValue(activeSection, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={4}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors resize-none"
                  />
                ) : (
                  <input
                    type="text"
                    value={values[field.key] ?? ''}
                    onChange={e => setValue(activeSection, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 transition-colors"
                  />
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-400">
              Changes save directly to Firebase Firestore and reflect on the website immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
