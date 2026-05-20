'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Users, Calendar, Trophy, MapPin, Mail, Clock,
  X, Send, CheckCircle, Camera, ChevronRight, Phone
} from 'lucide-react'

// ── Inline social icons (lucide-react doesn't have these) ──
function IgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  )
}
function FbIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  )
}
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.17 8.17 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z" />
    </svg>
  )
}

// ── Basketball SVG watermark ──
function BasketballWatermark() {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="absolute inset-0 w-full h-full" style={{ opacity: 0.04 }}>
      <circle cx="100" cy="100" r="90" fill="none" stroke="white" strokeWidth="6" />
      <path d="M10 100 Q55 60 100 100 Q145 140 190 100" fill="none" stroke="white" strokeWidth="6" />
      <path d="M10 100 Q55 140 100 100 Q145 60 190 100" fill="none" stroke="white" strokeWidth="6" />
      <line x1="100" y1="10" x2="100" y2="190" stroke="white" strokeWidth="6" />
    </svg>
  )
}

// ── Types ──
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
  contact_phone: string | null
  faculty: string | null
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
  end_date: string | null
  location: string | null
  description: string | null
  expected_attendance: number | null
}
interface Achievement {
  id: string
  title: string
  content: string | null
  event_date: string
  category: string
  is_milestone: boolean
}
interface GalleryItem {
  id: string
  title: string
  media_url: string
  event_date: string
}
interface JoinForm {
  full_name: string
  student_id: string
  email: string
  phone: string
  motivation: string
}

const CATEGORY_EMOJI: Record<string, string> = {
  Sports: '🏅', Cultural: '🎭', Academic: '📚',
  Religious: '🕌', Interest: '⭐', Others: '🎯',
}

export default function ClubPublicPage() {
  const params = useParams()
  const slug = params.slug as string

  const [club, setClub] = useState<Club | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [gallery, setGallery] = useState<GalleryItem[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [achievementCount, setAchievementCount] = useState(0)
  const [galleryCount, setGalleryCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  // Join form
  const [joinForm, setJoinForm] = useState<JoinForm>({ full_name: '', student_id: '', email: '', phone: '', motivation: '' })
  const [joining, setJoining] = useState(false)
  const [joinDone, setJoinDone] = useState(false)

  // Lightbox
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  // Refs for scroll
  const aboutRef = useRef<HTMLDivElement>(null)
  const activitiesRef = useRef<HTMLDivElement>(null)
  const galleryRef = useRef<HTMLDivElement>(null)
  const joinRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (slug) loadData() }, [slug])

  async function loadData() {
    const supabase = createClient()
    const { data: clubData } = await supabase.from('uco_clubs').select('*').eq('slug', slug).single()
    if (!clubData) { setNotFound(true); setLoading(false); return }
    setClub(clubData)
    const clubId = clubData.id
    const today = new Date().toISOString().split('T')[0]
    const thisYear = new Date().getFullYear().toString()

    const [membersRes, activitiesRes, achieveRes, galleryRes, upcomingRes, achieveListRes, galleryListRes] = await Promise.all([
      supabase.from('uco_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId).eq('status', 'active'),
      supabase.from('uco_activities').select('id', { count: 'exact', head: true }).eq('club_id', clubId).gte('activity_date', thisYear + '-01-01'),
      supabase.from('uco_history').select('id', { count: 'exact', head: true }).eq('club_id', clubId).in('category', ['Achievement', 'Championship', 'Award']),
      supabase.from('uco_history').select('id', { count: 'exact', head: true }).eq('club_id', clubId).not('media_url', 'is', null),
      supabase.from('uco_activities').select('id,title,activity_date,end_date,location,description,expected_attendance')
        .eq('club_id', clubId).gte('activity_date', today).neq('status', 'cancelled').order('activity_date').limit(3),
      supabase.from('uco_history').select('id,title,content,event_date,category,is_milestone')
        .eq('club_id', clubId).in('category', ['Achievement', 'Championship', 'Award', 'Milestone']).order('event_date', { ascending: false }).limit(8),
      supabase.from('uco_history').select('id,title,media_url,event_date')
        .eq('club_id', clubId).not('media_url', 'is', null).order('event_date', { ascending: false }).limit(12),
    ])

    setMemberCount(membersRes.count || 0)
    setActivityCount(activitiesRes.count || 0)
    setAchievementCount(achieveRes.count || 0)
    setGalleryCount(galleryRes.count || 0)
    setActivities(upcomingRes.data || [])
    setAchievements(achieveListRes.data || [])
    setGallery((galleryListRes.data || []).filter((g): g is GalleryItem => !!g.media_url))
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
  function scrollTo(ref: React.RefObject<HTMLDivElement>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function getAchievementIcon(cat: string, milestone: boolean) {
    if (milestone) return '🏆'
    if (cat === 'Championship') return '🥇'
    if (cat === 'Achievement') return '🎖️'
    if (cat === 'Award') return '🏅'
    return '⭐'
  }

  // ── Loading ──
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0F172A' }}>
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4 animate-pulse" style={{ background: '#F97316' }}>U</div>
        <p className="text-white/60 text-sm">Loading club page...</p>
      </div>
    </div>
  )

  // ── Not Found ──
  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0F172A' }}>
      <div className="text-center">
        <div className="text-7xl mb-6">🏀</div>
        <h1 className="text-3xl font-black text-white mb-3">Club Not Found</h1>
        <p className="text-white/50 mb-8">This club page doesn&apos;t exist or the link may have changed.</p>
        <Link href="https://solo-ai-uniclubos.vercel.app" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white" style={{ background: '#F97316' }}>
          Back to UniClub OS
        </Link>
      </div>
    </div>
  )

  const categoryEmoji = CATEGORY_EMOJI[club!.category || ''] || '🎯'
  const whatsappLink = `https://wa.me/?text=${encodeURIComponent(`Hi! I'd like to join ${club!.name}. Please let me know how to apply!`)}`

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO
      ═══════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '70vh' }}>
        {/* Background */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #1E3A8A 0%, #1e40af 50%, #0F172A 100%)'
        }}>
          {club!.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={club!.cover_image_url} alt="cover" className="absolute inset-0 w-full h-full object-cover" />
          )}
          {/* Basketball watermark */}
          {!club!.cover_image_url && <BasketballWatermark />}
          {/* Overlay */}
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.52)' }} />
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center text-center px-4 py-20 w-full max-w-4xl mx-auto">
          {/* Logo */}
          <div className="mb-6">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center mx-auto" style={{ background: '#1E3A8A' }}>
              {club!.logo_url
                ? ( // eslint-disable-next-line @next/next/no-img-element
                    <img src={club!.logo_url} alt="logo" className="w-full h-full object-cover" />)
                : <span className="text-white font-black text-5xl">{club!.name[0]}</span>
              }
            </div>
          </div>

          {/* Category badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold" style={{ background: '#F97316', color: '#fff' }}>
              {categoryEmoji} {club!.category || 'Club'}
            </span>
            {club!.founded_year && (
              <span className="px-3 py-1.5 rounded-full text-sm font-medium text-white/80 border border-white/20">
                Est. {club!.founded_year}
              </span>
            )}
          </div>

          {/* Club name */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-3">
            {club!.name}
          </h1>

          {/* University */}
          {club!.university_name && (
            <p className="text-lg sm:text-xl text-white/70 mb-8 font-medium">{club!.university_name}</p>
          )}

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {club!.allow_join_applications && (
              <button onClick={() => scrollTo(joinRef)}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base shadow-lg hover:opacity-90 transition-all active:scale-95"
                style={{ background: '#F97316' }}>
                🏅 Join This Club
              </button>
            )}
            {club!.contact_email && (
              <a href={`mailto:${club!.contact_email}`}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base border-2 border-white/50 hover:bg-white/10 transition-all">
                <Mail size={18} /> Contact Us
              </a>
            )}
            {!club!.contact_email && (
              <button onClick={() => scrollTo(aboutRef)}
                className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-white text-base border-2 border-white/50 hover:bg-white/10 transition-all">
                Learn More <ChevronRight size={18} />
              </button>
            )}
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-3">
            {club!.instagram_url && (
              <a href={club!.instagram_url} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <IgIcon size={18} />
              </a>
            )}
            {club!.facebook_url && (
              <a href={club!.facebook_url} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <FbIcon size={18} />
              </a>
            )}
            {club!.tiktok_url && (
              <a href={club!.tiktok_url} target="_blank" rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-all">
                <TikTokIcon size={18} />
              </a>
            )}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40">
          <div className="w-5 h-8 rounded-full border border-white/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-white/50 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 2 — STATS BAR
      ═══════════════════════════════════════════ */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
            {[
              { icon: <Users size={22} />, value: club!.show_member_count ? memberCount : '—', label: 'Active Members' },
              { icon: <Calendar size={22} />, value: activityCount, label: 'Events This Year' },
              { icon: <Trophy size={22} />, value: achievementCount, label: 'Achievements' },
              { icon: <Camera size={22} />, value: galleryCount, label: 'Memories' },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center py-8 px-4 text-center">
                <div className="mb-2" style={{ color: '#F97316' }}>{stat.icon}</div>
                <div className="text-3xl sm:text-4xl font-black mb-1" style={{ color: '#1E3A8A' }}>{stat.value}</div>
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 3 — ABOUT US
      ═══════════════════════════════════════════ */}
      <section ref={aboutRef} className="py-16 lg:py-24" style={{ background: '#F8FAFC' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 items-start">
            {/* Left: Description */}
            <div className="lg:col-span-3">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-8 rounded-full" style={{ background: '#F97316' }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#F97316' }}>About Us</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6 leading-tight" style={{ color: '#1E3A8A' }}>
                About Our Club
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                {club!.description || `Welcome to ${club!.name}! We are a passionate group of students dedicated to our craft, building community, and creating memories that last a lifetime. Join us and be part of something amazing.`}
              </p>

              {/* Quick Nav Pills */}
              <div className="flex flex-wrap gap-2 mt-8">
                {club!.show_activities && activities.length > 0 && (
                  <button onClick={() => scrollTo(activitiesRef)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 hover:bg-blue-50 transition-all"
                    style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}>
                    <Calendar size={14} /> Activities
                  </button>
                )}
                {club!.show_gallery && (gallery.length > 0) && (
                  <button onClick={() => scrollTo(galleryRef)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border-2 hover:bg-blue-50 transition-all"
                    style={{ borderColor: '#1E3A8A', color: '#1E3A8A' }}>
                    <Camera size={14} /> Gallery
                  </button>
                )}
                {club!.allow_join_applications && (
                  <button onClick={() => scrollTo(joinRef)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: '#F97316' }}>
                    Join Now <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Info Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100" style={{ background: '#1E3A8A' }}>
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Club Details</h3>
                </div>
                <div className="divide-y divide-gray-50">
                  {[
                    { icon: <MapPin size={15} />, label: 'University', val: club!.university_name },
                    { icon: <Users size={15} />, label: 'Faculty', val: club!.faculty },
                    { icon: <Mail size={15} />, label: 'Email', val: club!.contact_email },
                    { icon: <Phone size={15} />, label: 'Phone', val: club!.contact_phone },
                    { icon: <Users size={15} />, label: 'Max Members', val: club!.max_members ? `${club!.max_members} members` : null },
                    { icon: <Calendar size={15} />, label: 'Founded', val: club!.founded_year ? `${club!.founded_year}` : null },
                  ].filter(r => r.val).map((row, i) => (
                    <div key={i} className="flex items-start gap-3 px-5 py-3.5">
                      <span className="mt-0.5 flex-shrink-0" style={{ color: '#F97316' }}>{row.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">{row.label}</p>
                        <p className="text-sm font-semibold text-gray-700">{row.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 4 — UPCOMING ACTIVITIES
      ═══════════════════════════════════════════ */}
      {club!.show_activities && (
        <section ref={activitiesRef} className="py-16 lg:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            {/* Section Header */}
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-8 rounded-full" style={{ background: '#F97316' }} />
                  <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#F97316' }}>Calendar</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: '#1E3A8A' }}>
                  What&apos;s Coming Up
                </h2>
              </div>
            </div>

            {activities.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
                <Calendar size={40} className="mx-auto mb-4 text-gray-300" />
                <p className="font-bold text-gray-400 text-lg mb-1">No upcoming activities</p>
                <p className="text-gray-300 text-sm">Check back soon for upcoming events!</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {activities.map(act => (
                  <div key={act.id} className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden">
                    {/* Orange accent bar */}
                    <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #F97316, #fb923c)' }} />
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: 'rgba(249,115,22,0.1)', color: '#F97316' }}>
                          Upcoming
                        </span>
                      </div>
                      <h3 className="font-black text-gray-900 text-lg leading-tight mb-3">{act.title}</h3>
                      {act.description && (
                        <p className="text-sm text-gray-500 mb-3 leading-relaxed line-clamp-2">{act.description}</p>
                      )}
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Clock size={13} style={{ color: '#F97316' }} />
                          <span>{formatDate(act.activity_date)}</span>
                        </div>
                        {act.location && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin size={13} style={{ color: '#F97316' }} />
                            <span>{act.location}</span>
                          </div>
                        )}
                        {act.expected_attendance && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Users size={13} style={{ color: '#F97316' }} />
                            <span>{act.expected_attendance} spots</span>
                          </div>
                        )}
                      </div>
                      <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90"
                        style={{ background: '#25D366' }}>
                        <Send size={13} /> RSVP via WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 5 — ACHIEVEMENTS
      ═══════════════════════════════════════════ */}
      <section className="py-16 lg:py-24 overflow-hidden" style={{ background: '#0F172A' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-end gap-4 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-8 rounded-full" style={{ background: '#F97316' }} />
                <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#F97316' }}>Hall of Fame</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Our Achievements
              </h2>
            </div>
          </div>

          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-white/10 py-16 text-center">
              <Trophy size={40} className="mx-auto mb-4" style={{ color: '#F59E0B' }} />
              <p className="font-bold text-white/50 text-lg mb-1">Our story is just beginning.</p>
              <p className="text-white/30 text-sm">Check back for updates on our achievements!</p>
            </div>
          ) : (
            <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6" style={{ scrollbarWidth: 'none' }}>
              {achievements.map((ach) => (
                <div key={ach.id} className="flex-shrink-0 w-64 rounded-2xl p-5 border border-white/10 hover:border-orange-500/50 transition-all" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="text-4xl mb-4">{getAchievementIcon(ach.category, ach.is_milestone)}</div>
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#F97316' }}>
                    {ach.category} · {ach.event_date.split('-')[0]}
                  </div>
                  <h3 className="font-black text-white text-base leading-tight mb-2">{ach.title}</h3>
                  {ach.content && <p className="text-white/50 text-sm leading-relaxed line-clamp-3">{ach.content}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          SECTION 6 — PHOTO GALLERY
      ═══════════════════════════════════════════ */}
      {club!.show_gallery && (
        <section ref={galleryRef} className="py-16 lg:py-24 bg-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-1 h-8 rounded-full" style={{ background: '#F97316' }} />
                  <span className="text-sm font-bold uppercase tracking-widest" style={{ color: '#F97316' }}>Gallery</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-black leading-tight" style={{ color: '#1E3A8A' }}>
                  Our Moments
                </h2>
              </div>
            </div>

            {gallery.length === 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="aspect-square rounded-2xl flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                    <Camera size={28} style={{ color: '#CBD5E1' }} />
                  </div>
                ))}
                <div className="col-span-2 sm:col-span-3 text-center py-4">
                  <p className="text-gray-400 text-sm font-medium">Photos coming soon. Stay tuned!</p>
                </div>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 gap-3 space-y-3">
                {gallery.map((item) => (
                  <div key={item.id}
                    className="break-inside-avoid rounded-2xl overflow-hidden cursor-pointer relative group"
                    onClick={() => setLightbox(item)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.media_url} alt={item.title} className="w-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-end p-3 opacity-0 group-hover:opacity-100">
                      <p className="text-white text-xs font-bold leading-tight">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lightbox */}
          {lightbox && (
            <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
              <button className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-all">
                <X size={20} />
              </button>
              <div className="max-w-4xl w-full" onClick={e => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox.media_url} alt={lightbox.title} className="w-full max-h-[80vh] object-contain rounded-2xl" />
                <p className="text-white text-center mt-4 font-semibold">{lightbox.title}</p>
                <p className="text-white/50 text-center text-sm mt-1">{formatDate(lightbox.event_date)}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════
          SECTION 7 — JOIN US CTA
      ═══════════════════════════════════════════ */}
      {club!.allow_join_applications && (
        <section ref={joinRef} className="py-16 lg:py-24 relative overflow-hidden" style={{ background: '#F97316' }}>
          {/* Background pattern */}
          <div className="absolute inset-0" style={{ opacity: 0.06 }}>
            <BasketballWatermark />
          </div>

          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Copy */}
              <div>
                <p className="text-orange-100 font-bold uppercase tracking-widest text-sm mb-4">Ready to join?</p>
                <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight mb-5">
                  Want to be part of<br />
                  <span className="text-orange-100">{club!.name}?</span>
                </h2>
                <p className="text-orange-50 text-lg leading-relaxed mb-8">
                  Apply now and our captain will get back to you. We welcome all passionate members who share our love for the sport!
                </p>
                <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                  {[
                    '✅ Free to apply',
                    '⚡ Quick response',
                    '🤝 All skill levels welcome',
                  ].map(t => <span key={t}>{t}</span>)}
                </div>
              </div>

              {/* Right: Form */}
              <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8">
                {joinDone ? (
                  <div className="text-center py-8">
                    <CheckCircle size={56} className="mx-auto mb-4" style={{ color: '#10B981' }} />
                    <h3 className="text-xl font-black mb-2" style={{ color: '#1E3A8A' }}>Application Submitted!</h3>
                    <p className="text-gray-500">We&apos;ll be in touch soon. Welcome to the family! 🏀</p>
                  </div>
                ) : (
                  <form onSubmit={submitJoin} className="space-y-4">
                    <h3 className="text-xl font-black mb-5" style={{ color: '#1E3A8A' }}>Join Application</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Full Name *</label>
                        <input required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                          style={{ ['--tw-ring-color' as string]: '#F97316' }}
                          placeholder="Your full name"
                          value={joinForm.full_name}
                          onChange={e => setJoinForm(p => ({ ...p, full_name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Student ID *</label>
                        <input required
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                          placeholder="e.g. 2024001234"
                          value={joinForm.student_id}
                          onChange={e => setJoinForm(p => ({ ...p, student_id: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                        <input
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                          placeholder="+60 12-345 6789"
                          value={joinForm.phone}
                          onChange={e => setJoinForm(p => ({ ...p, phone: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Email *</label>
                        <input required type="email"
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                          placeholder="student@university.edu.my"
                          value={joinForm.email}
                          onChange={e => setJoinForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Why do you want to join?</label>
                        <textarea
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 transition-all resize-none"
                          placeholder="Tell us a bit about yourself and why you want to join..."
                          rows={3}
                          value={joinForm.motivation}
                          onChange={e => setJoinForm(p => ({ ...p, motivation: e.target.value }))} />
                      </div>
                    </div>
                    <button type="submit" disabled={joining}
                      className="w-full py-4 rounded-xl font-black text-white text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-98 disabled:opacity-60"
                      style={{ background: '#1E3A8A' }}>
                      {joining ? 'Submitting...' : <>Submit Application <ChevronRight size={18} /></>}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════ */}
      <footer style={{ background: '#0F172A' }}>
        {/* Main footer */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
          <div className="grid sm:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-lg" style={{ background: '#1E3A8A' }}>
                  {club!.name[0]}
                </div>
                <div>
                  <p className="font-black text-white text-sm leading-tight">{club!.name}</p>
                  <p className="text-white/40 text-xs">{club!.university_name}</p>
                </div>
              </div>
              {club!.description && (
                <p className="text-white/40 text-sm leading-relaxed line-clamp-3">{club!.description}</p>
              )}
            </div>

            {/* Nav Links */}
            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Explore</h4>
              <ul className="space-y-2">
                {[
                  { label: 'About', ref: aboutRef },
                  ...(club!.show_activities ? [{ label: 'Activities', ref: activitiesRef }] : []),
                  ...(club!.show_gallery ? [{ label: 'Gallery', ref: galleryRef }] : []),
                  ...(club!.allow_join_applications ? [{ label: 'Join Us', ref: joinRef }] : []),
                ].map(link => (
                  <li key={link.label}>
                    <button onClick={() => scrollTo(link.ref)}
                      className="text-white/50 hover:text-white text-sm transition-colors font-medium">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Social & Contact */}
            <div>
              <h4 className="text-white/60 text-xs font-bold uppercase tracking-widest mb-4">Connect</h4>
              <div className="flex gap-2 mb-4">
                {club!.instagram_url && (
                  <a href={club!.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    <IgIcon size={16} />
                  </a>
                )}
                {club!.facebook_url && (
                  <a href={club!.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    <FbIcon size={16} />
                  </a>
                )}
                {club!.tiktok_url && (
                  <a href={club!.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all">
                    <TikTokIcon size={16} />
                  </a>
                )}
              </div>
              {club!.contact_email && (
                <a href={`mailto:${club!.contact_email}`} className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2">
                  <Mail size={13} /> {club!.contact_email}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-white/30 text-xs">© {new Date().getFullYear()} {club!.name}. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/admin-login"
                className="text-white/20 hover:text-white/50 text-xs transition-colors">
                Admin Login
              </Link>
              <a href="https://solo-ai-uniclubos.vercel.app" target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs transition-colors font-medium">
                Powered by UniClub OS 🔗
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
