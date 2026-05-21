'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Plus, X, Save, BookOpen, Star, Trophy } from 'lucide-react'

interface HistoryEntry {
  id: string
  title: string
  content: string
  event_date: string
  category: string
  is_milestone: boolean
  media_url: string | null
  recorded_by: string | null
}

const CATEGORIES = ['Achievement', 'Event', 'Milestone', 'Championship', 'Annual', 'Formation', 'Other']

export default function HistoryPage() {
  const { user } = useAppStore()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Partial<HistoryEntry> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { loadEntries() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadEntries() {
    const supabase = createClient()
    let q = supabase.from('uco_history').select('*').order('event_date', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setEntries(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditing({ category: 'Achievement', is_milestone: false, event_date: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  async function saveEntry() {
    setSaveError('')
    if (!editing?.title) { setSaveError('Title is required'); return }
    if (!editing?.content) { setSaveError('Story / Description is required'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      title: editing.title,
      content: editing.content,
      description: editing.content,
      event_date: editing.event_date || new Date().toISOString().split('T')[0],
      category: editing.category || 'Achievement',
      is_milestone: editing.is_milestone ?? false,
      media_url: editing.media_url || null,
      recorded_by: editing.recorded_by || null,
      club_id: user?.club_id,
    }
    if (editing.id) {
      await supabase.from('uco_history').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id)
    } else {
      await supabase.from('uco_history').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadEntries() }, 1200)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  // Group by year
  const byYear = entries.reduce<Record<string, HistoryEntry[]>>((acc, e) => {
    const year = e.event_date.split('-')[0]
    if (!acc[year]) acc[year] = []
    acc[year].push(e)
    return acc
  }, {})
  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a))

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <BookOpen size={22} style={{ color: '#F59E0B' }} /> Club History
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">{entries.length} entries &bull; {entries.filter(e => e.is_milestone).length} milestones</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> Add Entry
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading history...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm mb-1">No history recorded yet</p>
          <p className="text-xs text-uco-text-muted mb-4">Start building your club archive</p>
          <button onClick={openAdd} className="btn-primary text-sm inline-flex">
            <Plus size={15} /> Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {years.map(year => (
            <div key={year}>
              <div className="flex items-center gap-3 mb-4">
                <div className="text-2xl font-black" style={{ color: '#1E3A8A' }}>{year}</div>
                <div className="flex-1 h-px bg-uco-border" />
                <span className="text-xs text-uco-text-muted">{byYear[year].length} entries</span>
              </div>
              <div className="space-y-3 pl-2 border-l-2 ml-3" style={{ borderColor: 'rgba(30,58,138,0.2)' }}>
                {byYear[year].map(entry => (
                  <div key={entry.id} className="relative pl-5">
                    <div className="absolute -left-[17px] top-3 w-3.5 h-3.5 rounded-full border-2 border-uco-blue bg-white" />
                    <div className={`bg-white rounded-2xl border p-5 hover:shadow-sm transition-all ${entry.is_milestone ? 'border-yellow-300' : 'border-uco-border'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {entry.is_milestone && <Trophy size={14} style={{ color: '#F59E0B' }} />}
                            <h3 className="font-bold text-uco-text">{entry.title}</h3>
                            <span className="badge-blue text-xs">{entry.category}</span>
                            {entry.is_milestone && <span className="badge text-xs" style={{ background: 'rgba(245,158,11,0.1)', color: '#B45309' }}>Milestone</span>}
                          </div>
                          <p className="text-xs text-uco-text-muted mb-2">{formatDate(entry.event_date)}{entry.recorded_by ? ` • By ${entry.recorded_by}` : ''}</p>
                          <p className="text-sm text-uco-text-muted leading-relaxed">{entry.content}</p>
                        </div>
                        <button onClick={() => { setEditing({ ...entry }); setShowModal(true) }}
                          className="text-xs font-semibold flex-shrink-0 hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">{editing.id ? 'Edit History Entry' : 'Add History Entry'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="e.g. Won MASUM Basketball Gold Medal"
                  value={editing.title || ''}
                  onChange={e => setEditing(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Story / Description *</label>
                <textarea className="input min-h-[100px] resize-none" placeholder="Describe this moment in your club history..."
                  value={editing.content || ''}
                  onChange={e => setEditing(prev => ({ ...prev, content: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date"
                    value={editing.event_date || ''}
                    onChange={e => setEditing(prev => ({ ...prev, event_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={editing.category || 'Achievement'}
                    onChange={e => setEditing(prev => ({ ...prev, category: e.target.value }))}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Recorded By</label>
                <input className="input" placeholder="Secretary / Captain"
                  value={editing.recorded_by || ''}
                  onChange={e => setEditing(prev => ({ ...prev, recorded_by: e.target.value }))} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editing.is_milestone}
                  onChange={e => setEditing(prev => ({ ...prev, is_milestone: e.target.checked }))}
                  className="w-4 h-4 rounded accent-yellow-500" />
                <span className="text-sm font-medium text-uco-text flex items-center gap-1.5">
                  <Star size={14} style={{ color: '#F59E0B' }} /> Mark as Club Milestone
                </span>
              </label>
            </div>
            <div className="px-6 py-4 border-t border-uco-border">
              {saveError && (
                <p className="text-red-500 text-xs mb-3 font-medium">⚠️ {saveError}</p>
              )}
              <div className="flex justify-end gap-3">
                <button onClick={() => { setShowModal(false); setSaveError('') }} className="btn-outline text-sm px-4 py-2">Cancel</button>
                <button onClick={saveEntry} disabled={saving}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                  <Save size={14} />
                  {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Entry'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
