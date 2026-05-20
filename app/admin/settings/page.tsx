'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Save, Settings, Building2, User, Shield, Globe, Link, Copy, Check, Upload, Instagram, Facebook, ExternalLink } from 'lucide-react'

interface Club {
  id: string
  name: string
  description: string | null
  founded_year: number | null
  faculty: string | null
  contact_email: string | null
  contact_phone: string | null
  max_members: number | null
  status: string
  slug: string | null
  cover_image_url: string | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  show_activities: boolean
  show_member_count: boolean
  show_gallery: boolean
  allow_join_applications: boolean
}

export default function SettingsPage() {
  const { user } = useAppStore()
  const [club, setClub] = useState<Partial<Club>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'club' | 'public' | 'profile'>('club')
  const [slugError, setSlugError] = useState('')
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadClub() }, [])
  useEffect(() => { setFullName(user?.full_name || '') }, [user])

  async function loadClub() {
    const supabase = createClient()
    let q = supabase.from('uco_clubs').select('*')
    if (user?.club_id) q = q.eq('id', user.club_id)
    const { data } = await q.limit(1).single()
    if (data) setClub(data)
    else setClub({ status: 'active', show_activities: true, show_member_count: true, show_gallery: true, allow_join_applications: true })
    setLoading(false)
  }

  const publicUrl = club.slug ? `https://solo-ai-uniclubos.vercel.app/club/${club.slug}` : null

  function copyLink() {
    if (!publicUrl) return
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function uploadCover(file: File) {
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `covers/${club.id || 'new'}_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('uco-club-assets').upload(path, file, { upsert: true })
    if (!error) {
      const { data: urlData } = supabase.storage.from('uco-club-assets').getPublicUrl(path)
      setClub(prev => ({ ...prev, cover_image_url: urlData.publicUrl }))
    }
    setUploading(false)
  }

  async function saveClub() {
    if (!club.name) return
    setSlugError('')

    // Validate slug format
    if (club.slug && !/^[a-z0-9-]+$/.test(club.slug)) {
      setSlugError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }

    setSaving(true)
    const supabase = createClient()
    const payload = {
      name: club.name,
      description: club.description || null,
      founded_year: club.founded_year ? Number(club.founded_year) : null,
      faculty: club.faculty || null,
      contact_email: club.contact_email || null,
      contact_phone: club.contact_phone || null,
      max_members: club.max_members ? Number(club.max_members) : null,
      status: club.status || 'active',
      slug: club.slug || null,
      cover_image_url: club.cover_image_url || null,
      instagram_url: club.instagram_url || null,
      facebook_url: club.facebook_url || null,
      tiktok_url: club.tiktok_url || null,
      show_activities: club.show_activities ?? true,
      show_member_count: club.show_member_count ?? true,
      show_gallery: club.show_gallery ?? true,
      allow_join_applications: club.allow_join_applications ?? true,
      updated_at: new Date().toISOString(),
    }

    if (club.id) {
      const { error } = await supabase.from('uco_clubs').update(payload).eq('id', club.id)
      if (error?.message?.includes('unique') || error?.message?.includes('slug')) {
        setSlugError('This slug is already taken. Choose another.')
        setSaving(false)
        return
      }
    } else {
      const { data } = await supabase.from('uco_clubs').insert(payload).select().single()
      if (data) setClub(data)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function saveProfile() {
    if (!user?.id || !fullName) return
    setProfileSaving(true)
    const supabase = createClient()
    await supabase.from('uco_users').update({ full_name: fullName, updated_at: new Date().toISOString() }).eq('id', user.id)
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
          <Settings size={22} style={{ color: '#64748B' }} /> Settings
        </h1>
        <p className="text-uco-text-muted text-sm mt-0.5">Manage your club profile, public page, and account</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-uco-surface rounded-xl mb-6 w-fit">
        {([
          { id: 'club', label: 'Club Profile', icon: Building2 },
          { id: 'public', label: 'Public Page', icon: Globe },
          { id: 'profile', label: 'My Account', icon: User },
        ] as const).map(tab => {
          const Icon = tab.icon
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id ? 'bg-white shadow-sm text-uco-text' : 'text-uco-text-muted hover:text-uco-text'}`}>
              <Icon size={14} /> {tab.label}
            </button>
          )
        })}
      </div>

      {/* ─── Club Profile Tab ─── */}
      {activeTab === 'club' && (
        <div className="bg-white rounded-2xl border border-uco-border p-6">
          <div className="flex items-center gap-2 mb-5">
            <Building2 size={18} style={{ color: '#1E3A8A' }} />
            <h2 className="font-bold text-uco-text">Club Information</h2>
          </div>
          {loading ? (
            <p className="text-sm text-uco-text-muted">Loading...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="label">Club Name *</label>
                <input className="input" placeholder="USJ Basketball Club"
                  value={club.name || ''}
                  onChange={e => setClub(prev => ({ ...prev, name: e.target.value }))} />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input min-h-[80px] resize-none" placeholder="Brief description of your club..."
                  value={club.description || ''}
                  onChange={e => setClub(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Founded Year</label>
                  <input className="input" type="number" placeholder="2010"
                    value={club.founded_year || ''}
                    onChange={e => setClub(prev => ({ ...prev, founded_year: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Faculty / Department</label>
                  <input className="input" placeholder="Faculty of Engineering"
                    value={club.faculty || ''}
                    onChange={e => setClub(prev => ({ ...prev, faculty: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contact Email</label>
                  <input className="input" type="email" placeholder="club@university.edu.my"
                    value={club.contact_email || ''}
                    onChange={e => setClub(prev => ({ ...prev, contact_email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Contact Phone</label>
                  <input className="input" placeholder="+60 12-345 6789"
                    value={club.contact_phone || ''}
                    onChange={e => setClub(prev => ({ ...prev, contact_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Max Members</label>
                  <input className="input" type="number" placeholder="50"
                    value={club.max_members || ''}
                    onChange={e => setClub(prev => ({ ...prev, max_members: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={club.status || 'active'}
                    onChange={e => setClub(prev => ({ ...prev, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="pt-2">
                <button onClick={saveClub} disabled={saving}
                  className="btn-primary text-sm disabled:opacity-60">
                  <Save size={14} />
                  {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Club Profile'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── Public Page Tab ─── */}
      {activeTab === 'public' && (
        <div className="space-y-5">
          {/* Public URL Card */}
          <div className="bg-white rounded-2xl border border-uco-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text">Public Page URL</h2>
            </div>
            {publicUrl ? (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-uco-surface rounded-xl px-4 py-2.5 text-sm text-uco-text font-mono truncate border border-uco-border">
                  {publicUrl}
                </div>
                <button onClick={copyLink}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-uco-border text-sm font-semibold hover:bg-uco-surface transition-colors flex-shrink-0"
                  style={{ color: copied ? '#10B981' : '#1E3A8A' }}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <a href={publicUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-uco-border text-sm font-semibold hover:bg-uco-surface transition-colors flex-shrink-0"
                  style={{ color: '#1E3A8A' }}>
                  <ExternalLink size={14} /> View
                </a>
              </div>
            ) : (
              <div className="text-sm text-uco-text-muted bg-uco-surface rounded-xl px-4 py-3 border border-uco-border">
                Set a slug below to generate your public page URL
              </div>
            )}
          </div>

          {/* Slug + Cover + Social */}
          <div className="bg-white rounded-2xl border border-uco-border p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Link size={18} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text">Page Identity</h2>
            </div>

            {/* Slug */}
            <div>
              <label className="label">Club Slug</label>
              <div className="flex items-center gap-0">
                <span className="text-xs text-uco-text-muted bg-uco-surface border border-r-0 border-uco-border rounded-l-xl px-3 py-2.5 font-mono whitespace-nowrap">/club/</span>
                <input className="input rounded-l-none flex-1" placeholder="usj-basketball"
                  value={club.slug || ''}
                  onChange={e => { setSlugError(''); setClub(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })) }} />
              </div>
              {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
              <p className="text-xs text-uco-text-muted mt-1">Lowercase letters, numbers and hyphens only</p>
            </div>

            {/* Cover Image */}
            <div>
              <label className="label">Cover Image</label>
              {club.cover_image_url && (
                <div className="mb-2 rounded-xl overflow-hidden border border-uco-border h-32 bg-uco-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={club.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f) }} />
              <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-uco-border text-sm font-semibold hover:bg-uco-surface transition-colors disabled:opacity-60"
                style={{ color: '#1E3A8A' }}>
                <Upload size={14} />
                {uploading ? 'Uploading...' : club.cover_image_url ? 'Change Cover' : 'Upload Cover Image'}
              </button>
              <p className="text-xs text-uco-text-muted mt-1">Recommended: 1200×400px, JPG or PNG</p>
            </div>

            {/* Social Links */}
            <div>
              <label className="label flex items-center gap-1.5 mb-3">Social Links</label>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(225,48,108,0.1)' }}>
                    <Instagram size={16} style={{ color: '#E1306C' }} />
                  </div>
                  <input className="input flex-1" placeholder="https://instagram.com/yourclub"
                    value={club.instagram_url || ''}
                    onChange={e => setClub(prev => ({ ...prev, instagram_url: e.target.value }))} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(24,119,242,0.1)' }}>
                    <Facebook size={16} style={{ color: '#1877F2' }} />
                  </div>
                  <input className="input flex-1" placeholder="https://facebook.com/yourclub"
                    value={club.facebook_url || ''}
                    onChange={e => setClub(prev => ({ ...prev, facebook_url: e.target.value }))} />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(0,0,0,0.06)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#000' }}>
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.17 8.17 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z"/>
                    </svg>
                  </div>
                  <input className="input flex-1" placeholder="https://tiktok.com/@yourclub"
                    value={club.tiktok_url || ''}
                    onChange={e => setClub(prev => ({ ...prev, tiktok_url: e.target.value }))} />
                </div>
              </div>
            </div>
          </div>

          {/* Public Page Toggles */}
          <div className="bg-white rounded-2xl border border-uco-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Globe size={18} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text">Public Page Settings</h2>
            </div>
            <div className="space-y-4">
              {([
                { key: 'show_activities', label: 'Show Activities', desc: 'Display upcoming activities on your public page' },
                { key: 'show_member_count', label: 'Show Member Count', desc: 'Show number of active members' },
                { key: 'show_gallery', label: 'Show Gallery', desc: 'Display photo gallery section' },
                { key: 'allow_join_applications', label: 'Allow Join Applications', desc: 'Let visitors submit a join request' },
              ] as const).map(item => {
                const on = !!(club[item.key] ?? true)
                return (
                  <div key={item.key} className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-uco-text">{item.label}</p>
                      <p className="text-xs text-uco-text-muted">{item.desc}</p>
                    </div>
                    <button type="button"
                      onClick={() => setClub(prev => ({ ...prev, [item.key]: !on }))}
                      className="relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none"
                      style={{ backgroundColor: on ? '#1E3A8A' : '#D1D5DB' }}>
                      <span
                        className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                        style={{ transform: on ? 'translateX(20px)' : 'translateX(0px)' }} />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button onClick={saveClub} disabled={saving}
              className="btn-primary text-sm disabled:opacity-60">
              <Save size={14} />
              {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Public Page Settings'}
            </button>
          </div>
        </div>
      )}

      {/* ─── My Account Tab ─── */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-uco-border p-6">
            <div className="flex items-center gap-2 mb-5">
              <User size={18} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text">My Profile</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={fullName}
                  onChange={e => setFullName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email</label>
                <input className="input" value={user?.email || ''} disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                <p className="text-xs text-uco-text-muted mt-1">Email cannot be changed here</p>
              </div>
              <button onClick={saveProfile} disabled={profileSaving}
                className="btn-primary text-sm disabled:opacity-60">
                <Save size={14} />
                {profileSaving ? 'Saving...' : profileSaved ? '✓ Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-uco-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={18} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text">Account Info</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b border-uco-border">
                <span className="text-uco-text-muted">Role</span>
                <span className="badge-blue">{user?.platform_role || 'admin'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-uco-border">
                <span className="text-uco-text-muted">User ID</span>
                <span className="text-xs text-uco-text-muted font-mono truncate max-w-[200px]">{user?.id}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
