'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Save, Settings, Building2, User, Shield } from 'lucide-react'

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
}

export default function SettingsPage() {
  const { user } = useAppStore()
  const [club, setClub] = useState<Partial<Club>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState<'club' | 'profile'>('club')

  // Profile fields
  const [fullName, setFullName] = useState(user?.full_name || '')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  useEffect(() => { loadClub() }, [])
  useEffect(() => { setFullName(user?.full_name || '') }, [user])

  async function loadClub() {
    const supabase = createClient()
    const { data } = await supabase.from('uco_clubs').select('*').limit(1).single()
    if (data) setClub(data)
    else setClub({ status: 'active' })
    setLoading(false)
  }

  async function saveClub() {
    if (!club.name) return
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
      updated_at: new Date().toISOString(),
    }
    if (club.id) {
      await supabase.from('uco_clubs').update(payload).eq('id', club.id)
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
        <p className="text-uco-text-muted text-sm mt-0.5">Manage your club profile and account settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-uco-surface rounded-xl mb-6 w-fit">
        {([
          { id: 'club', label: 'Club Profile', icon: Building2 },
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
