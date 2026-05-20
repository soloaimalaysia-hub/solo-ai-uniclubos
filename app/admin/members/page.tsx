'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Plus, Search, X, Save, Phone, Mail, Users } from 'lucide-react'

interface Member {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  role: string
  student_id: string | null
  joined_at: string
  status: string
  faculty: string | null
  year_of_study: number | null
}

const ROLES = ['Member', 'Captain', 'Vice Captain', 'Secretary', 'Treasurer', 'Committee', 'Advisor']
const STATUSES = ['active', 'inactive', 'graduated']

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

export default function MembersPage() {
  const { user } = useAppStore()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Partial<Member> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { loadMembers() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadMembers() {
    const supabase = createClient()
    let q = supabase.from('uco_members').select('*').order('joined_at', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setMembers(data || [])
    setLoading(false)
  }

  function openAdd() {
    setEditingMember({ role: 'Member', status: 'active', joined_at: new Date().toISOString().split('T')[0] })
    setShowModal(true)
  }

  function openEdit(m: Member) {
    setEditingMember({ ...m })
    setShowModal(true)
  }

  async function saveMember() {
    if (!editingMember?.full_name) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      full_name: editingMember.full_name,
      email: editingMember.email || null,
      phone: editingMember.phone || null,
      role: editingMember.role || 'Member',
      position: editingMember.role || 'Member',
      student_id: editingMember.student_id || null,
      status: editingMember.status || 'active',
      faculty: editingMember.faculty || null,
      year_of_study: editingMember.year_of_study ? Number(editingMember.year_of_study) : null,
      joined_at: editingMember.joined_at || new Date().toISOString().split('T')[0],
      joined_date: editingMember.joined_at || new Date().toISOString().split('T')[0],
      club_id: user?.club_id,
    }
    if (editingMember.id) {
      await supabase.from('uco_members').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingMember.id)
    } else {
      await supabase.from('uco_members').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadMembers() }, 1200)
  }

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (m.email?.toLowerCase().includes(search.toLowerCase())) ||
    (m.role?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <Users size={22} style={{ color: '#1E3A8A' }} /> Members
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">{members.filter(m => m.status === 'active').length} active members</p>
        </div>
        <button onClick={openAdd} className="btn-primary text-sm">
          <Plus size={16} /> Add Member
        </button>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-uco-text-muted" />
        <input className="input pl-10" placeholder="Search by name, email or role..."
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading members...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Users size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm">No members found</p>
          <button onClick={openAdd} className="btn-primary text-sm mt-4 inline-flex">
            <Plus size={15} /> Add First Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-uco-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-uco-border bg-uco-surface">
                  <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Member</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Role</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide hidden lg:table-cell">Joined</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-uco-border">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-uco-surface transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0"
                          style={{ background: '#1E3A8A' }}>{initials(m.full_name)}</div>
                        <div>
                          <p className="font-semibold text-uco-text">{m.full_name}</p>
                          {m.student_id && <p className="text-xs text-uco-text-muted">{m.student_id}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5"><span className="badge-blue">{m.role || 'Member'}</span></td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="space-y-0.5">
                        {m.email && <div className="flex items-center gap-1.5 text-xs text-uco-text-muted"><Mail size={11} />{m.email}</div>}
                        {m.phone && <div className="flex items-center gap-1.5 text-xs text-uco-text-muted"><Phone size={11} />{m.phone}</div>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell text-xs text-uco-text-muted">
                      {m.joined_at ? new Date(m.joined_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={m.status === 'active' ? 'badge-green' : 'badge-gray'}>{m.status}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openEdit(m)} className="text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">{editingMember.id ? 'Edit Member' : 'Add New Member'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="label">Full Name *</label>
                  <input className="input" placeholder="Ahmad bin Abu Bakar"
                    value={editingMember.full_name || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, full_name: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Role</label>
                  <select className="input" value={editingMember.role || 'Member'}
                    onChange={e => setEditingMember(prev => ({ ...prev, role: e.target.value }))}>
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={editingMember.status || 'active'}
                    onChange={e => setEditingMember(prev => ({ ...prev, status: e.target.value }))}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" placeholder="ahmad@university.edu.my"
                    value={editingMember.email || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, email: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input" placeholder="+60 12-345 6789"
                    value={editingMember.phone || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Student ID</label>
                  <input className="input" placeholder="A20001234"
                    value={editingMember.student_id || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, student_id: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Faculty</label>
                  <input className="input" placeholder="Faculty of Engineering"
                    value={editingMember.faculty || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, faculty: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Year of Study</label>
                  <input className="input" type="number" min={1} max={6} placeholder="2"
                    value={editingMember.year_of_study || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, year_of_study: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Join Date</label>
                  <input className="input" type="date"
                    value={editingMember.joined_at?.split('T')[0] || ''}
                    onChange={e => setEditingMember(prev => ({ ...prev, joined_at: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-uco-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
              <button onClick={saveMember} disabled={saving}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                <Save size={14} />
                {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Member'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
