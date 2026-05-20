'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Plus, X, Save, Bell, Pin, Eye, EyeOff, Calendar } from 'lucide-react'

interface Announcement {
  id: string
  title: string
  content: string
  is_pinned: boolean
  is_published: boolean
  published_at: string | null
  expires_at: string | null
  created_by_name: string | null
}

export default function AnnouncementsPage() {
  const { user } = useAppStore()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Partial<Announcement> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadItems() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadItems() {
    const supabase = createClient()
    let q = supabase.from('uco_announcements').select('*').order('created_at', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setItems(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing({ is_pinned: false, is_published: true, published_at: new Date().toISOString() })
    setShowModal(true)
  }

  async function saveItem() {
    if (!editing?.title || !editing?.content) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: editing.title,
      content: editing.content,
      is_pinned: editing.is_pinned ?? false,
      is_published: editing.is_published ?? true,
      published_at: editing.is_published ? (editing.published_at || new Date().toISOString()) : null,
      expires_at: editing.expires_at || null,
      created_by_name: editing.created_by_name || null,
      club_id: user?.club_id,
    }
    if (editing.id) {
      await supabase.from('uco_announcements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('uco_announcements').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadItems() }, 1200)
  }

  async function togglePin(item: Announcement) {
    const supabase = createClient()
    await supabase.from('uco_announcements').update({ is_pinned: !item.is_pinned, updated_at: new Date().toISOString() }).eq('id', item.id)
    loadItems()
  }

  async function togglePublish(item: Announcement) {
    const supabase = createClient()
    await supabase.from('uco_announcements').update({
      is_published: !item.is_published,
      published_at: !item.is_published ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    }).eq('id', item.id)
    loadItems()
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const pinned = items.filter(i => i.is_pinned && i.is_published)
  const others = items.filter(i => !i.is_pinned || !i.is_published)

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <Bell size={22} style={{ color: '#8B5CF6' }} /> Announcements
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">{pinned.length} pinned &bull; {items.length} total</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16">
          <Bell size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm mb-4">No announcements yet</p>
          <button onClick={openAdd} className="btn-primary text-sm inline-flex">
            <Plus size={15} /> Create Announcement
          </button>
        </div>
      ) : (
        <>
          {pinned.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Pin size={14} style={{ color: '#F97316' }} />
                <h2 className="text-sm font-bold text-uco-text-muted uppercase tracking-wide">Pinned</h2>
              </div>
              <div className="space-y-3">
                {pinned.map(item => (
                  <AnnouncementCard key={item.id} item={item} onEdit={() => { setEditing({ ...item }); setShowModal(true) }}
                    onTogglePin={() => togglePin(item)} onTogglePublish={() => togglePublish(item)} formatDate={formatDate} />
                ))}
              </div>
            </div>
          )}
          {others.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-uco-text-muted uppercase tracking-wide mb-3">All Announcements</h2>
              <div className="space-y-3">
                {others.map(item => (
                  <AnnouncementCard key={item.id} item={item} onEdit={() => { setEditing({ ...item }); setShowModal(true) }}
                    onTogglePin={() => togglePin(item)} onTogglePublish={() => togglePublish(item)} formatDate={formatDate} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">{editing.id ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Important: AGM Details"
                  value={editing.title || ''}
                  onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Content *</label>
                <textarea className="input min-h-[120px] resize-none" placeholder="Write your announcement here..."
                  value={editing.content || ''}
                  onChange={e => setEditing(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              <div>
                <label className="label">Author</label>
                <input className="input" placeholder="Captain / Committee"
                  value={editing.created_by_name || ''}
                  onChange={e => setEditing(prev => ({ ...prev, created_by_name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Expires On (optional)</label>
                <input className="input" type="date"
                  value={editing.expires_at?.split('T')[0] || ''}
                  onChange={e => setEditing(prev => ({ ...prev, expires_at: e.target.value }))} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.is_pinned}
                    onChange={e => setEditing(prev => ({ ...prev, is_pinned: e.target.checked }))}
                    className="w-4 h-4 rounded accent-orange-500" />
                  <span className="text-sm font-medium text-uco-text">Pin this announcement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!editing.is_published}
                    onChange={e => setEditing(prev => ({ ...prev, is_published: e.target.checked }))}
                    className="w-4 h-4 rounded accent-blue-600" />
                  <span className="text-sm font-medium text-uco-text">Publish now</span>
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-uco-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
              <button onClick={saveItem} disabled={saving}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                <Save size={14} />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function AnnouncementCard({ item, onEdit, onTogglePin, onTogglePublish, formatDate }: {
  item: Announcement
  onEdit: () => void
  onTogglePin: () => void
  onTogglePublish: () => void
  formatDate: (d: string) => string
}) {
  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all ${item.is_pinned && item.is_published ? 'border-orange-200' : 'border-uco-border'}`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {item.is_pinned && <Pin size={13} style={{ color: '#F97316' }} />}
            <h3 className="font-bold text-uco-text truncate">{item.title}</h3>
            {!item.is_published && <span className="badge-gray text-xs">Draft</span>}
          </div>
          <p className="text-sm text-uco-text-muted leading-relaxed line-clamp-2">{item.content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-uco-border">
        <div className="flex items-center gap-1.5 text-xs text-uco-text-muted">
          <Calendar size={11} />
          {item.published_at ? formatDate(item.published_at) : 'Not published'}
          {item.created_by_name && ` • ${item.created_by_name}`}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onTogglePin} title={item.is_pinned ? 'Unpin' : 'Pin'}
            className={`p-1.5 rounded-lg transition-colors ${item.is_pinned ? 'bg-orange-50 text-orange-500' : 'hover:bg-uco-surface text-uco-text-muted'}`}>
            <Pin size={13} />
          </button>
          <button onClick={onTogglePublish} title={item.is_published ? 'Unpublish' : 'Publish'}
            className={`p-1.5 rounded-lg transition-colors ${item.is_published ? 'bg-green-50 text-green-600' : 'hover:bg-uco-surface text-uco-text-muted'}`}>
            {item.is_published ? <Eye size={13} /> : <EyeOff size={13} />}
          </button>
          <button onClick={onEdit}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-uco-surface transition-colors" style={{ color: '#1E3A8A' }}>
            Edit
          </button>
        </div>
      </div>
    </div>
  )
}
