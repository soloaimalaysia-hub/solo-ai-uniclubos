'use client'

import { useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Link, Play, Image as ImageIcon, Loader2 } from 'lucide-react'

// ── Video link helpers ──────────────────────────────────────
export function getVideoMeta(url: string): { type: 'youtube' | 'tiktok' | 'other'; thumb: string | null; embedId: string | null } {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
  if (yt) return { type: 'youtube', thumb: `https://img.youtube.com/vi/${yt[1]}/hqdefault.jpg`, embedId: yt[1] }
  if (url.includes('tiktok.com')) return { type: 'tiktok', thumb: null, embedId: null }
  return { type: 'other', thumb: null, embedId: null }
}

// ── Photo Upload Component ───────────────────────────────────
interface PhotoUploadProps {
  photos: string[]          // existing photo URLs
  onChange: (urls: string[]) => void
  bucket?: string
  path: string              // e.g. 'history/club_id/entry_id'
  maxPhotos?: number
}

export function PhotoUpload({ photos, onChange, bucket = 'uco-media', path, maxPhotos = 20 }: PhotoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)

  async function handleFiles(files: FileList) {
    if (!files.length) return
    const remaining = maxPhotos - photos.length
    if (remaining <= 0) return
    const toUpload = Array.from(files).slice(0, remaining).filter(f => f.type.startsWith('image/'))
    if (!toUpload.length) return

    setUploading(true)
    setProgress(0)
    const supabase = createClient()
    const newUrls: string[] = []

    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i]
      const ext = file.name.split('.').pop()
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
      const fullPath = `${path}/${filename}`
      const { error } = await supabase.storage.from(bucket).upload(fullPath, file, { upsert: true })
      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(fullPath)
        newUrls.push(data.publicUrl)
      }
      setProgress(Math.round(((i + 1) / toUpload.length) * 100))
    }

    onChange([...photos, ...newUrls])
    setUploading(false)
    setProgress(0)
  }

  async function removePhoto(url: string) {
    const supabase = createClient()
    // Extract storage path from URL
    const match = url.match(/\/storage\/v1\/object\/public\/uco-media\/(.+)/)
    if (match) await supabase.storage.from(bucket).remove([match[1]])
    onChange(photos.filter(p => p !== url))
  }

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {photos.length < maxPhotos && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
          style={{ borderColor: dragOver ? '#F97316' : '#CBD5E1', background: dragOver ? 'rgba(249,115,22,0.05)' : '#F8FAFC' }}>
          <input ref={inputRef} type="file" multiple accept="image/*" className="hidden"
            onChange={e => { if (e.target.files) handleFiles(e.target.files); e.target.value = '' }} />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={24} className="animate-spin" style={{ color: '#F97316' }} />
              <p className="text-sm font-medium text-gray-500">Uploading... {progress}%</p>
              <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#F97316' }} />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload size={24} style={{ color: '#94A3B8' }} />
              <p className="text-sm font-semibold text-gray-500">Drag photos here or <span style={{ color: '#1E3A8A' }}>click to select</span></p>
              <p className="text-xs text-gray-400">{photos.length}/{maxPhotos} photos · JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      )}

      {/* Thumbnail grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
              <button
                type="button"
                onClick={() => removePhoto(url)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                <X size={10} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded font-medium">Cover</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Video Link Component ─────────────────────────────────────
interface VideoLinksProps {
  links: string[]
  onChange: (links: string[]) => void
}

export function VideoLinks({ links, onChange }: VideoLinksProps) {
  const [input, setInput] = useState('')

  function addLink() {
    const trimmed = input.trim()
    if (!trimmed || links.includes(trimmed)) return
    if (!trimmed.startsWith('http')) return
    onChange([...links, trimmed])
    setInput('')
  }

  function removeLink(url: string) {
    onChange(links.filter(l => l !== url))
  }

  return (
    <div className="space-y-3">
      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 text-sm"
            placeholder="Paste YouTube / TikTok / Instagram link..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addLink())} />
        </div>
        <button type="button" onClick={addLink}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
          style={{ background: '#1E3A8A' }}>
          Add
        </button>
      </div>

      {/* Link cards */}
      {links.length > 0 && (
        <div className="space-y-2">
          {links.map((url, i) => {
            const meta = getVideoMeta(url)
            return (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 group">
                {/* Thumbnail or icon */}
                <div className="w-14 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 flex items-center justify-center">
                  {meta.thumb
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={meta.thumb} alt="" className="w-full h-full object-cover" />
                    : <Play size={16} className="text-gray-400" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5"
                    style={{ color: meta.type === 'youtube' ? '#FF0000' : meta.type === 'tiktok' ? '#000' : '#64748B' }}>
                    {meta.type === 'youtube' ? 'YouTube' : meta.type === 'tiktok' ? 'TikTok' : 'Video'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{url}</p>
                </div>
                <button type="button" onClick={() => removeLink(url)}
                  className="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                  <X size={11} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-xs text-gray-400 flex items-center gap-1">
        <ImageIcon size={11} /> Supports YouTube, TikTok, Instagram Reels
      </p>
    </div>
  )
}
