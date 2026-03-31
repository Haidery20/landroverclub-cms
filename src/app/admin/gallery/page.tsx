'use client'
import { useState, useEffect, useRef } from 'react'
import { getGallery, createGalleryItem, updateGalleryItem, deleteGalleryItem } from '@/lib/db'
import { GalleryItem } from '@/lib/types'
import { uploadImage } from '@/lib/storage'
import ConfirmDelete from '@/components/admin/ConfirmDelete'

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeAlbum, setActiveAlbum] = useState('All')
  const [editing, setEditing] = useState<GalleryItem | null>(null)
  const [editForm, setEditForm] = useState({ title: '', description: '', album: '', is_featured: false })
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [newAlbum, setNewAlbum] = useState('')
  const [showAlbumInput, setShowAlbumInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchItems() }, [])

  async function fetchItems() {
    const data = await getGallery()
    setItems(data)
    setLoading(false)
  }

  const albums = ['All', ...Array.from(new Set(items.map(i => i.album).filter(Boolean)))]
  const filtered = activeAlbum === 'All' ? items : items.filter(i => i.album === activeAlbum)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    setUploadProgress(0)
    const album = activeAlbum === 'All' ? 'General' : activeAlbum
    let done = 0
    for (const file of files) {
      const url = await uploadImage(file, 'gallery', album.toLowerCase().replace(/\s+/g, '-'))
      if (url) {
        await createGalleryItem({
          title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]/g, ' '),
          image_url: url,
          album,
          is_featured: false,
          sort_order: 0,
        })
      }
      done++
      setUploadProgress(Math.round((done / files.length) * 100))
    }
    setUploading(false)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
    fetchItems()
  }

  function openEdit(item: GalleryItem) {
    setEditForm({ title: item.title, description: item.description ?? '', album: item.album, is_featured: item.is_featured })
    setEditing(item)
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault()
    await updateGalleryItem(editing!.id, editForm)
    setEditing(null)
    fetchItems()
  }

  async function handleDelete() {
    setDeleting(true)
    await deleteGalleryItem(deleteTarget!.id)
    setDeleting(false)
    setDeleteTarget(null)
    fetchItems()
  }

  async function toggleFeatured(item: GalleryItem) {
    await updateGalleryItem(item.id, { is_featured: !item.is_featured })
    fetchItems()
  }

  async function addAlbum() {
    if (!newAlbum.trim()) return
    setActiveAlbum(newAlbum.trim())
    setNewAlbum('')
    setShowAlbumInput(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery</h1>
          <p className="text-gray-500 text-sm mt-1">{items.length} photos across {albums.length - 1} albums</p>
        </div>
        <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="bg-[#0a0f0d] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:opacity-50">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>
          Upload Photos
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleUpload} className="hidden" />
      </div>

      {uploading && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">Uploading photos…</span>
            <span className="text-sm text-green-600">{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {albums.map(album => (
          <button key={album} onClick={() => setActiveAlbum(album)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all flex-shrink-0 ${activeAlbum === album ? 'bg-[#0a0f0d] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {album}
            {album !== 'All' && <span className="ml-1.5 text-xs opacity-60">({items.filter(i => i.album === album).length})</span>}
          </button>
        ))}
        {showAlbumInput ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <input type="text" value={newAlbum} onChange={e => setNewAlbum(e.target.value)} onKeyDown={e => e.key === 'Enter' && addAlbum()} placeholder="Album name" autoFocus className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-green-400 w-36" />
            <button onClick={addAlbum} className="bg-green-500 text-white px-3 py-2 rounded-xl text-sm font-medium">Add</button>
            <button onClick={() => setShowAlbumInput(false)} className="text-gray-400 hover:text-gray-700">✕</button>
          </div>
        ) : (
          <button onClick={() => setShowAlbumInput(true)} className="px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-700 border border-dashed border-gray-200 flex-shrink-0">+ New Album</button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">🖼️</div>
          <p className="text-gray-500 text-sm">No photos here yet.</p>
          <button onClick={() => fileInputRef.current?.click()} className="inline-block mt-4 text-green-600 font-medium text-sm hover:underline">Upload Photos</button>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map(item => (
            <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-gray-100 aspect-square">
              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
              {item.is_featured && <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full">★ Featured</div>}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-end gap-2">
                  <button onClick={() => toggleFeatured(item)} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${item.is_featured ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20 text-white hover:bg-yellow-400 hover:text-yellow-900'}`}>★</button>
                  <button onClick={() => openEdit(item)} className="w-8 h-8 bg-white/20 hover:bg-white rounded-lg flex items-center justify-center text-white hover:text-gray-800 transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" /></svg>
                  </button>
                  <button onClick={() => setDeleteTarget(item)} className="w-8 h-8 bg-white/20 hover:bg-red-500 rounded-lg flex items-center justify-center text-white transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                  </button>
                </div>
                <p className="text-white text-xs font-medium truncate">{item.title}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-5">Edit Photo</h2>
            <form onSubmit={saveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Title</label>
                <input type="text" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} required className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Album</label>
                <input type="text" value={editForm.album} onChange={e => setEditForm(p => ({ ...p, album: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400" list="albums-list" />
                <datalist id="albums-list">{albums.filter(a => a !== 'All').map(a => <option key={a} value={a} />)}</datalist>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2">Caption</label>
                <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-green-400 resize-none" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={editForm.is_featured} onChange={e => setEditForm(p => ({ ...p, is_featured: e.target.checked }))} className="sr-only" />
                  <div className={`w-11 h-6 rounded-full transition-colors ${editForm.is_featured ? 'bg-green-500' : 'bg-gray-200'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform mt-0.5 ${editForm.is_featured ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </div>
                </div>
                <span className="text-sm text-gray-700">Feature on homepage</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setEditing(null)} className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-[#0a0f0d] text-white rounded-xl text-sm font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && <ConfirmDelete title="this photo" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />}
    </div>
  )
}
