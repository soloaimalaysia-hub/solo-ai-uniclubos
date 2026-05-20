'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Users, Calendar, Trophy, MapPin, Mail, Instagram,
  Facebook, Clock, X, Send, CheckCircle, ExternalLink
} from 'lucide-react'

interface Club {
  id: string
  name: string
  slug: string
  description: string | null
  university_name: string | null
  category: string | null
  founded_year: number | null
  logo_url: string | null
  cover_image_url: string | null
  contact_email: string | null
  max_members: number | null
  instagram_url: string | null
  facebook_url: string | null
  tiktok_url: string | null
  show_activities: boolean
  show_member_count: boolean
  show_gallery: boolean
  allow_join_applications: boolean
}

interface Activity {
  id: string
  title: string
  activity_date: string
  location: string | null
  description: string | null
}

interface Achievement {
  id: string
  title: string
  content: string | null
  event_date: string
  category: string
}

interface JoinForm {
  full_name: string
  student_id: string
  email: string
  phone: string
  motivation: string
}

const CATEGORY_COLORS: Record<string, string> = {
  Sports: 'bg-orange-100 text-orange-700',
  Cultural: 'bg-purple-100 text-purple-700',
  Academic: 'bg-blue-100 text-blue-700',
  Religious: 'bg-green-100 text-green-700',
  Interest: 'bg-pink-100 text-pink-700',
  Others: 'bg-gray-100 text-gray-700',
}

function slugToWhatsApp(name: string) {
  return `https://wa.me/?text=Hi, I'm interested in joining ${encodeURIComponent(name)}!`
}

export default function ClubPublicPage() {
  const params = useParams()
  const slug = params.slug as string

  const [club, setClub] = useState<Club | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [historyCount, setHistoryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinForm, setJoinForm] = useState<JoinForm>({ full_name: '', student_id: '', email: '', phone: '', motivation: '' })
  const [joining, setJoining] = useState(false)
  const [joinDone, setJoinDone] = useState(false)

  useEffect(() => { if (slug) loadData() }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    const supabase = createClient()

    const { data: clubData } = await supabase
      .from('uco_clubs')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!clubData) { setNotFound(true); setLoading(false); return }
    setClub(clubData)

    const clubId = clubData.id
    const today = new Date().toISOString().split('T')[0]

    const [membersRes, activitiesCountRes, historyRes, upcomingRes, achievementsRes] = await Promise.all([
      supabase.from('uco_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('status', 'active'),
      supabase.from('uco_activities').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('status', 'completed'),
      supabase.from('uco_history').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
      supabase.from('uco_activities').select('id,title,activity_date,location,description')
        .eq('club_id', clubId)
        .gte('activity_date', today)
        .order('activity_date').limit(3),
      supabase.from('uco_history').select('id,title,content,event_date,category')
        .eq('club_id', clubId)
        .in('category', ['Achievement', 'Championship', 'Award'])
        .order('event_date', { ascending: false }).limit(6),
    ])

    setMemberCount(membersRes.count || 0)
    setActivityCount(activitiesCountRes.count || 0)
    setHistoryCount(historyRes.count || 0)
    setActivities(upcomingRes.data || [])
    setAchievements(achievementsRes.data || [])
    setLoading(false)
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!club || !joinForm.full_name || !joinForm.email) return
    setJoining(true)
    const supabase = createClient()
    await supabase.from('uco_members').insert({
      club_id: club.id,
      full_name: joinForm.full_name,
      student_id: joinForm.student_id || null,
      email: joinForm.email,
      phone: joinForm.phone || null,
      role: 'Member',
      position: 'Member',
      status: 'pending',
      notes: joinForm.motivation || null,
      joined_at: new Date().toISOString().split('T')[0],
      joined_date: new Date().toISOString().split('T')[0],
    })
    setJoining(false)
    setJoinDone(true)
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-uco-surface">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-uco-blue flex items-center justify-center text-white font-black mx-auto mb-3">U</div>
        <p className="text-sm text-uco-text-muted">Loading club...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-uco-surface px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🏀</div>
        <h1 className="text-2xl font-black text-uco-text mb-2">Club not found</h1>
        <p className="text-uco-text-muted mb-6">The club page you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="https://solo-ai-uniclubos.vercel.app" className="btn-primary inline-flex">Back to UniClub OS</Link>
      </div>
    </div>
  )

  const categoryColor = CATEGORY_COLORS[club!.category || ''] || 'bg-gray-100 text-gray-700'

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* COVER + HEADER */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-48 sm:h-64 lg:h-80 w-full overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
          {club!.cover_image_url && (
            <img src={club!.cover_image_url} alt="cover" className="w-full h-full object-cover opacity-80" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        </div>

        {/* Club info overlay */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row items-start sm:items-end gap-4 pb-6">
            {/* Logo */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-white shadow-xl flex-shrink-0 overflow-hidden"
              style={{ background: '#1E3A8A' }}>
              {club!.logo_url
                ? <img src={club!.logo_url} alt="logo" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-white font-black text-3xl">
                    {club!.name[0]}
                  </div>
              }
            </div>
            {/* Club name & info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${categoryColor}`}>
                  {club!.category}
                </span>
                {club!.founded_year && (
                  <span className="text-xs text-white/80 font-medium bg-black/30 px-2 py-0.5 rounded-full">
                    Est. {club!.founded_year}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">{club!.name}</h1>
              {club!.university_name && (
                <p className="text-white/80 text-sm mt-0.5">{club!.university_name}</p>
              )}
            </div>
            {/* Social links */}
            <div className="flex gap-2 flex-shrink-0">
              {club!.instagram_url && (
                <a href={club!.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                  <Instagram size={16} />
                </a>
              )}
              {club!.facebook_url && (
                <a href={club!.facebook_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                  <Facebook size={16} />
                </a>
              )}
              {club!.tiktok_url && (
                <a href={club!.tiktok_url} target="_blank" rel="noopener noreferrer"
                  className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-all">
                  <span className="text-white text-xs font-black">TK</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div className="border-y border-uco-border bg-uco-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-3 divide-x divide-uco-border">
            {[
              { label: 'Active Members', value: club!.show_member_count ? memberCount : '—', icon: Users, color: '#1E3A8A' },
              { label: 'Events Completed', value: activityCount, icon: Calendar, color: '#F97316' },
              { label: 'History Entries', value: historyCount, icon: Trophy, color: '#10B981' },
            ].map(stat => {
              const Icon = stat.icon
              return (
                <div key={stat.label} className="py-5 px-4 sm:px-8 text-center">
                  <Icon size={18} className="mx-auto mb-1" style={{ color: stat.color }} />
                  <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-xs text-uco-text-muted font-medium mt-0.5">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-12">

        {/* ABOUT */}
        {club!.description && (
          <section>
            <h2 className="text-xl font-black text-uco-text mb-4">About Us</h2>
            <div className="bg-uco-surface rounded-2xl p-6 border border-uco-border">
              <p className="text-uco-text leading-relaxed">{club!.description}</p>
              <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-uco-border text-sm text-uco-text-muted">
                {club!.contact_email && (
                  <a href={`mailto:${club!.contact_email}`} className="flex items-center gap-1.5 hover:text-uco-blue transition-colors">
                    <Mail size={14} />{club!.contact_email}
                  </a>
                )}
                {club!.max_members && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} />Max {club!.max_members} members
                  </span>
                )}
              </div>
            </div>
          </section>
        )}

        {/* UPCOMING ACTIVITIES */}
        {club!.show_activities && activities.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-uco-text">Upcoming Activities</h2>
              <span className="badge-orange">{activities.length} upcoming</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map(act => (
                <div key={act.id} className="bg-white rounded-2xl border border-uco-border p-5 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ background: 'rgba(249,115,22,0.1)' }}>
                    <Calendar size={18} style={{ color: '#F97316' }} />
                  </div>
                  <h3 className="font-bold text-uco-text mb-1 leading-snug">{act.title}</h3>
                  {act.description && <p className="text-xs text-uco-text-muted mb-3 leading-relaxed line-clamp-2">{act.description}</p>}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-1.5 text-xs text-uco-text-muted">
                      <Clock size={11} />{formatDate(act.activity_date)}
                    </div>
                    {act.location && (
                      <div className="flex items-center gap-1.5 text-xs text-uco-text-muted">
                        <MapPin size={11} />{act.location}
                      </div>
                    )}
                  </div>
                  <a href={slugToWhatsApp(club!.name)} target="_blank" rel="noopener noreferrer"
                    className="block text-center py-2 rounded-xl text-xs font-bold text-white transition-all hover:opacity-90"
                    style={{ background: '#F97316' }}>
                    RSVP Interest
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ACHIEVEMENTS */}
        {achievements.length > 0 && (
          <section>
            <h2 className="text-xl font-black text-uco-text mb-4">Achievements</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(a => (
                <div key={a.id} className="bg-white rounded-2xl border border-yellow-200 p-5 hover:shadow-md transition-all"
                  style={{ background: 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 100%)' }}>
                  <div className="text-2xl mb-2">🏆</div>
                  <h3 className="font-bold text-uco-text mb-1 leading-snug">{a.title}</h3>
                  {a.content && <p className="text-xs text-uco-text-muted leading-relaxed line-clamp-3">{a.content}</p>}
                  <p className="text-xs font-medium mt-3" style={{ color: '#B45309' }}>{formatDate(a.event_date)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* JOIN CTA */}
        {club!.allow_join_applications && (
          <section>
            <div className="rounded-3xl p-10 text-center text-white"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
              <div className="text-4xl mb-4">🏀</div>
              <h2 className="text-2xl font-black mb-2">Want to join {club!.name}?</h2>
              <p className="text-blue-200 mb-6 max-w-md mx-auto">
                Apply now and our captain will get back to you. We welcome all passionate members!
              </p>
              <button onClick={() => setShowJoinModal(true)}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-uco-blue bg-white hover:bg-blue-50 transition-all shadow-lg">
                <Users size={18} /> Join This Club
              </button>
            </div>
          </section>
        )}
      </div>

      {/* FOOTER */}
      <footer className="border-t border-uco-border py-8 px-4 text-center bg-uco-surface">
        <a href="https://solo-ai-uniclubos.vercel.app" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-uco-text-muted hover:text-uco-blue transition-colors">
          <div className="w-5 h-5 rounded-md bg-uco-blue flex items-center justify-center text-white font-black text-xs">U</div>
          Powered by <strong className="text-uco-blue">UniClub OS</strong>
          <ExternalLink size={12} />
        </a>
      </footer>

      {/* JOIN MODAL */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {joinDone ? (
              <div className="p-10 text-center">
                <CheckCircle size={48} className="mx-auto mb-4" style={{ color: '#10B981' }} />
                <h2 className="text-xl font-black text-uco-text mb-2">Application Submitted!</h2>
                <p className="text-uco-text-muted text-sm mb-6">
                  The club captain will review your application and get in touch soon. 🎉
                </p>
                <button onClick={() => { setShowJoinModal(false); setJoinDone(false) }}
                  className="btn-primary inline-flex">Done</button>
              </div>
            ) : (
              <>
                <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
                  <div>
                    <h2 className="font-black text-uco-text">Join {club!.name}</h2>
                    <p className="text-xs text-uco-text-muted mt-0.5">Fill in your details to apply</p>
                  </div>
                  <button onClick={() => setShowJoinModal(false)}
                    className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted">
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={submitJoin} className="p-6 space-y-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input className="input" placeholder="Ahmad bin Abu Bakar" required
                      value={joinForm.full_name}
                      onChange={e => setJoinForm(p => ({ ...p, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Student ID</label>
                    <input className="input" placeholder="A20001234"
                      value={joinForm.student_id}
                      onChange={e => setJoinForm(p => ({ ...p, student_id: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input className="input" type="email" placeholder="you@university.edu.my" required
                      value={joinForm.email}
                      onChange={e => setJoinForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input className="input" placeholder="+60 12-345 6789"
                      value={joinForm.phone}
                      onChange={e => setJoinForm(p => ({ ...p, phone: e.target.value }))} />
                  </div>
                  <div>
                    <label className="label">Why do you want to join?</label>
                    <textarea className="input min-h-[80px] resize-none"
                      placeholder="Tell us a bit about yourself and your interest..."
                      value={joinForm.motivation}
                      onChange={e => setJoinForm(p => ({ ...p, motivation: e.target.value }))} />
                  </div>
                  <button type="submit" disabled={joining}
                    className="btn-primary w-full justify-center py-3 disabled:opacity-60">
                    <Send size={15} />
                    {joining ? 'Submitting...' : 'Submit Application'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
