'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Plus, X, Save, Calendar, MapPin, Clock, Users, Image as ImageIcon, Play } from 'lucide-react'
import { PhotoUpload, VideoLinks } from '@/components/MediaUpload'

interface Activity {
  id: string
  title: string
  description: string | null
  activity_date: string
  end_date: string | null
  location: string | null
  status: string
  expected_attendance: number | null
  actual_attendance: number | null
  notes: string | null
  event_photos: string[]
  event_video_links: string[]
}

const STATUSES = ['planned', 'ongoing', 'completed', 'cancelled']

function statusColor(s: string) {
  if (s === 'planned') return 'badge-blue'
  if (s === 'ongoing') return 'badge-orange'
  if (s === 'completed') return 'badge-green'
  return 'badge-gray'
}

export default function ActivitiesPage() {
  const { user } = useAppStore()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Partial<Activity> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => { loadActivities() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadActivities() {
    const supabase = createClient()
    let q = supabase.from('uco_activities').select('*').order('activity_date', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setActivities((data || []).map(a => ({
      ...a,
      event_photos: a.event_photos || [],
      event_video_links: a.event_video_links || [],
    })))
    setLoading(false)
  }

  function openAdd() {
    setEditingActivity({
      status: 'planned',
      activity_date: new Date().toISOString().split('T')[0],
      event_photos: [],
      event_video_links: [],
    })
    setSaveError('')
    setShowModal(true)
  }

  function openEdit(a: Activity) {
    setEditingActivity({ ...a, event_photos: a.event_photos || [], event_video_links: a.event_video_links || [] })
    setSaveError('')
    setShowModal(true)
  }

  function storagePath(activityId?: string) {
    return `activities/${user?.club_id || 'unknown'}/${activityId || `new_${Date.now()}`}`
  }

  async function saveActivity() {
    setSaveError('')
    if (!editingActivity?.title) { setSaveError('Activity title is required'); return }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      type: 'general',
      title: editingActivity.title,
      description: editingActivity.description || null,
      activity_date: editingActivity.activity_date || new Date().toISOString().split('T')[0],
      end_date: editingActivity.end_date || null,
      location: editingActivity.location || null,
      status: editingActivity.status || 'planned',
      expected_attendance: editingActivity.expected_attendance ? Number(editingActivity.expected_attendance) : null,
      actual_attendance: editingActivity.actual_attendance ? Number(editingActivity.actual_attendance) : null,
      notes: editingActivity.notes || null,
      event_photos: editingActivity.event_photos || [],
      event_video_links: editingActivity.event_video_links || [],
      club_id: user?.club_id,
    }
    if (editingActivity.id) {
      await supabase.from('uco_activities').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingActivity.id)
    } else {
      await supabase.from('uco_activities').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadActivities() }, 1200)
  }

  const upcoming = activities.filter(a => a.activity_date >= new Date().toISOString().split('T')[0] && a.status !== 'cancelled' && a.status !== 'completed')
  const past = activities.filter(a => a.activity_date < new Date().toISOString().split('T')[0] || a.status === 'completed' || a.status === 'cancelled')

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <Calendar size={22} style={{ color: '#F97316' }} /> Activities
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">{upcoming.length} upcoming &bull; {past.length} past</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> New Activity
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-16">
          <Calendar size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm mb-4">No activities yet</p>
          <button onClick={openAdd} className="btn-primary text-sm inline-flex">
            <Plus size={15} /> Create First Activity
          </button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-bold text-uco-text-muted uppercase tracking-wide mb-3">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map(a => (
                  <div key={a.id} className="bg-white rounded-2xl border border-uco-border p-5 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-uco-text">{a.title}</h3>
                          <span className={statusColor(a.status)}>{a.status}</span>
                        </div>
                        {a.description && <p className="text-sm text-uco-text-muted mb-2 leading-relaxed">{a.description}</p>}
                        <div className="flex flex-wrap gap-3 text-xs text-uco-text-muted">
                          <span className="flex items-center gap-1"><Clock size={11} />{formatDate(a.activity_date)}</span>
                          {a.location && <span className="flex items-center gap-1"><MapPin size={11} />{a.location}</span>}
                          {a.expected_attendance && <span className="flex items-center gap-1"><Users size={11} />{a.expected_attendance} expected</span>}
                        </div>
                      </div>
                      <button onClick={() => openEdit(a)}
                        className="text-xs font-semibold flex-shrink-0 hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-bold text-uco-text-muted uppercase tracking-wide mb-3">Past</h2>
              <div className="space-y-2">
                {past.map(a => (
                  <div key={a.id} className="bg-white rounded-xl border border-uco-border px-5 py-3.5 flex items-center gap-4 hover:shadow-sm transition-all">
                    {/* First photo thumb if any */}
                    {a.event_photos?.length > 0 ? (
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-uco-border flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.event_photos[0]} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-uco-surface border border-uco-border flex items-center justify-center flex-shrink-0">
                        <Calendar size={18} className="text-uco-border" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-uco-text truncate">{a.title}</p>
                        <span className={statusColor(a.status)}>{a.status}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-xs text-uco-text-muted flex items-center gap-1">
                          <Clock size={10} />{formatDate(a.activity_date)}
                          {a.actual_attendance && <span className="ml-2">• {a.actual_attendance} attended</span>}
                        </p>
                        {a.event_photos?.length > 0 && (
                          <span className="text-xs text-uco-text-muted flex items-center gap-1">
                            <ImageIcon size={10} /> {a.event_photos.length}
                          </span>
                        )}
                        {a.event_video_links?.length > 0 && (
                          <span className="text-xs text-uco-text-muted flex items-center gap-1">
                            <Play size={10} /> {a.event_video_links.length}
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => openEdit(a)}
                      className="text-xs font-semibold flex-shrink-0 hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && editingActivity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-uco-text">{editingActivity.id ? 'Edit Activity' : 'New Activity'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="label">Activity Title *</label>
                <input className="input" placeholder="e.g. Weekly Training Session"
                  value={editingActivity.title || ''}
                  onChange={e => setEditingActivity(prev => ({ ...prev, title: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="What will happen at this activity?"
                  value={editingActivity.description || ''}
                  onChange={e => setEditingActivity(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date *</label>
                  <input className="input" type="date"
                    value={editingActivity.activity_date || ''}
                    onChange={e => setEditingActivity(prev => ({ ...prev, activity_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">End Date</label>
                  <input className="input" type="date"
                    value={editingActivity.end_date || ''}
                    onChange={e => setEditingActivity(prev => ({ ...prev, end_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editingActivity.status || 'planned'}
                    onChange={e => setEditingActivity(prev => ({ ...prev, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Location</label>
                  <input className="input" placeholder="e.g. Sports Hall B"
                    value={editingActivity.location || ''}
                    onChange={e => setEditingActivity(prev => ({ ...prev, location: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Expected Attendance</label>
                  <input className="input" type="number" min={0} placeholder="20"
                    value={editingActivity.expected_attendance || ''}
                    onChange={e => setEditingActivity(prev => ({ ...prev, expected_attendance: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Actual Attendance</label>
                  <input className="input" type="number" min={0} placeholder="18"
                    value={editingActivity.actual_attendance || ''}
                    onChange={e => setEditingActivity(prev => ({ ...prev, actual_attendance: Number(e.target.value) }))} />
                </div>
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea className="input min-h-[60px] resize-none" placeholder="Any additional notes..."
                  value={editingActivity.notes || ''}
                  onChange={e => setEditingActivity(prev => ({ ...prev, notes: e.target.value }))} />
              </div>

              {/* ── Event Media ── */}
              <div className="border-t border-uco-border pt-4 space-y-5">
                <div className="flex items-center gap-2">
                  <ImageIcon size={15} style={{ color: '#F97316' }} />
                  <h3 className="font-bold text-sm text-uco-text">Event Media</h3>
                  <span className="text-xs text-uco-text-muted">· Photos &amp; videos from this event</span>
                </div>

                {/* Photos */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <ImageIcon size={13} /> Photos
                    <span className="text-xs font-normal text-uco-text-muted ml-1">
                      ({(editingActivity.event_photos || []).length}/20)
                    </span>
                  </label>
                  <PhotoUpload
                    photos={editingActivity.event_photos || []}
                    onChange={urls => setEditingActivity(prev => ({ ...prev, event_photos: urls }))}
                    path={storagePath(editingActivity.id)}
                    maxPhotos={20}
                  />
                </div>

                {/* Video links */}
                <div>
                  <label className="label flex items-center gap-1.5">
                    <Play size={13} /> Video Links
                    <span className="text-xs font-normal text-uco-text-muted ml-1">YouTube / TikTok</span>
                  </label>
                  <VideoLinks
                    links={editingActivity.event_video_links || []}
                    onChange={links => setEditingActivity(prev => ({ ...prev, event_video_links: links }))}
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-uco-border sticky bottom-0 bg-white">
              {saveError && <p className="text-red-500 text-xs mb-3 font-medium">⚠️ {saveError}</p>}
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowModal(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
                <button onClick={saveActivity} disabled={saving}
                  className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                  <Save size={14} />
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Activity'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
