'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Image as ImageIcon, Save, ExternalLink } from 'lucide-react'
import { PhotoUpload } from '@/components/MediaUpload'

export default function GalleryPage() {
  const { user } = useAppStore()
  const [clubId, setClubId] = useState<string | null>(null)
  const [clubSlug, setClubSlug] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadGallery() }, [])

  async function loadGallery() {
    const supabase = createClient()
    let q = supabase.from('uco_clubs').select('id, slug, gallery_photos')
    if (user?.club_id) q = q.eq('id', user.club_id)
    const { data } = await q.limit(1).single()
    if (data) {
      setClubId(data.id)
      setClubSlug(data.slug)
      setPhotos(data.gallery_photos || [])
    }
    setLoading(false)
  }

  async function saveGallery() {
    if (!clubId) return
    setSaving(true)
    const supabase = createClient()
    await supabase
      .from('uco_clubs')
      .update({ gallery_photos: photos, updated_at: new Date().toISOString() })
      .eq('id', clubId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <ImageIcon size={22} style={{ color: '#1E3A8A' }} /> Club Gallery
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">
            {photos.length} photo{photos.length !== 1 ? 's' : ''} · These appear on your public page &ldquo;Our Moments&rdquo; section
          </p>
        </div>
        {clubSlug && (
          <a href={`/club/${clubSlug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>
            <ExternalLink size={13} /> Preview Public Page
          </a>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading gallery...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-uco-border p-6 space-y-5">
          {/* Info banner */}
          <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: 'rgba(30,58,138,0.06)', border: '1px solid rgba(30,58,138,0.12)' }}>
            <ImageIcon size={16} style={{ color: '#1E3A8A', marginTop: 2, flexShrink: 0 }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1E3A8A' }}>How it works</p>
              <p className="text-xs text-uco-text-muted mt-0.5 leading-relaxed">
                Upload your best club photos here. They will show up in the <strong>&ldquo;Our Moments&rdquo;</strong> gallery on your public page.
                Drag to reorder is coming soon — for now, photos appear in upload order.
              </p>
            </div>
          </div>

          {/* Upload */}
          <div>
            <label className="label flex items-center gap-1.5 mb-3">
              <ImageIcon size={14} /> Photos
              <span className="text-xs font-normal text-uco-text-muted ml-1">({photos.length}/30) · JPG, PNG, WEBP</span>
            </label>
            <PhotoUpload
              photos={photos}
              onChange={setPhotos}
              path={`gallery/${clubId || 'unknown'}`}
              maxPhotos={30}
            />
          </div>

          {/* Save */}
          <div className="flex justify-end pt-2">
            <button onClick={saveGallery} disabled={saving}
              className="btn-primary text-sm px-6 py-2.5 disabled:opacity-60">
              <Save size={14} />
              {saving ? 'Saving...' : saved ? '✓ Saved to Public Page!' : 'Save Gallery'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
