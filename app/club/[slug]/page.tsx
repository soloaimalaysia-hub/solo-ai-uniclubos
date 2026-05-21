'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Users, Calendar, Trophy, MapPin, Mail, Clock,
  X, CheckCircle, Camera, ChevronRight, Phone,
} from 'lucide-react'

// ── Design tokens ──────────────────────────────────────────────────────────
const C = {
  blue:   '#1A237E',
  red:    '#E53935',
  orange: '#FF6B00',
  gold:   '#FFB300',
  dark:   '#0D0D0D',
  navy:   '#0D1B2A',
  gray:   '#F5F5F5',
  text:   '#555555',
  white:  '#FFFFFF',
}

// ── Theme background images ──────────────────────────────────────────────────
const SUPABASE_URL = 'https://klrfpzxjsacriaqtfssf.supabase.co/storage/v1/object/public/uco-media'
const HERO_BG  = `${SUPABASE_URL}/themes/default//WhatsApp%20Image%202026-05-21%20at%2018.06.02.jpeg`
const ABOUT_BG = `${SUPABASE_URL}/themes/default//WhatsApp%20Image%202026-05-21%20at%2017.52.20%20(2).jpeg`

// ── Inline social icons ────────────────────────────────────────────────────
function IgIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  )
}
function FbIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
    </svg>
  )
}
function TikTokIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.94a8.17 8.17 0 004.78 1.52V7.01a4.85 4.85 0 01-1.01-.32z"/>
    </svg>
  )
}

// ── Basketball SVG background ──────────────────────────────────────────────
function BasketballBg() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', opacity: 0.05 }}>
      <svg viewBox="0 0 600 600" style={{ position: 'absolute', right: -60, bottom: -60, width: 480, height: 480 }} fill="none" stroke="white" strokeWidth="7">
        <circle cx="300" cy="300" r="280"/>
        <path d="M20 300 Q160 160 300 300 Q440 440 580 300"/>
        <path d="M20 300 Q160 440 300 300 Q440 160 580 300"/>
        <line x1="300" y1="20" x2="300" y2="580"/>
        <line x1="20" y1="300" x2="580" y2="300"/>
      </svg>
      <svg viewBox="0 0 400 400" style={{ position: 'absolute', left: -40, top: -40, width: 280, height: 280, opacity: 0.5 }} fill="none" stroke="white" strokeWidth="7">
        <circle cx="200" cy="200" r="180"/>
        <path d="M20 200 Q110 100 200 200 Q290 300 380 200"/>
        <path d="M20 200 Q110 300 200 200 Q290 100 380 200"/>
        <line x1="200" y1="20" x2="200" y2="380"/>
      </svg>
    </div>
  )
}

// ── Section label component ────────────────────────────────────────────────
function SectionTag({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  void dark
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
      <div style={{ width: 4, height: 32, borderRadius: 2, background: C.red, flexShrink: 0 }} />
      <span style={{ color: C.red, fontWeight: 800, fontSize: 13, letterSpacing: 2.5, textTransform: 'uppercase' as const }}>{children}</span>
    </div>
  )
}

// ── Types ──────────────────────────────────────────────────────────────────
interface Club {
  id: string; name: string; slug: string
  description: string | null; university_name: string | null; category: string | null
  founded_year: number | null; logo_url: string | null; cover_image_url: string | null
  contact_email: string | null; contact_phone: string | null; faculty: string | null
  max_members: number | null; instagram_url: string | null; facebook_url: string | null
  tiktok_url: string | null; gallery_photos: string[]
  show_activities: boolean; show_member_count: boolean; show_gallery: boolean; allow_join_applications: boolean
}
interface Activity {
  id: string; title: string; activity_date: string; location: string | null
  description: string | null; expected_attendance: number | null; type: string | null
}
interface Achievement {
  id: string; title: string; content: string | null; event_date: string
  category: string; is_milestone: boolean
}
interface GalleryPhoto { url: string; title: string }
interface JoinForm { full_name: string; student_id: string; email: string; phone: string; motivation: string }

// ── Helpers ────────────────────────────────────────────────────────────────
function activityColor(type: string | null) {
  const t = (type || '').toLowerCase()
  if (t.includes('train')) return '#F97316'
  if (t.includes('game') || t.includes('match') || t.includes('tournament')) return C.blue
  if (t.includes('meet')) return '#10B981'
  if (t.includes('social')) return '#8B5CF6'
  return C.red
}

function trophyIcon(category: string, milestone: boolean): string {
  const c = category.toLowerCase()
  if (c.includes('champion') || c.includes('gold') || c.includes('first')) return '🥇'
  if (c.includes('runner') || c.includes('silver') || c.includes('second')) return '🥈'
  if (c.includes('third') || c.includes('bronze')) return '🥉'
  if (milestone) return '🏆'
  return '🏆'
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function ClubPublicPage() {
  const { slug } = useParams() as { slug: string }

  const [club, setClub]           = useState<Club | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [gallery, setGallery]     = useState<GalleryPhoto[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [activityCount, setActivityCount] = useState(0)
  const [achievementCount, setAchievementCount] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [notFound, setNotFound]   = useState(false)

  const [joinForm, setJoinForm]   = useState<JoinForm>({ full_name: '', student_id: '', email: '', phone: '', motivation: '' })
  const [joining, setJoining]     = useState(false)
  const [joinDone, setJoinDone]   = useState(false)
  const [lightbox, setLightbox]   = useState<GalleryPhoto | null>(null)

  const aboutRef      = useRef<HTMLElement>(null)
  const activitiesRef = useRef<HTMLElement>(null)
  const galleryRef    = useRef<HTMLElement>(null)
  const joinRef       = useRef<HTMLElement>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (slug) loadData() }, [slug])

  // Scroll-reveal
  useEffect(() => {
    if (loading) return
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('rv') }),
      { threshold: 0.07 }
    )
    document.querySelectorAll('.rvl').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [loading])

  async function loadData() {
    const sb = createClient()
    const { data: c } = await sb.from('uco_clubs').select('*').eq('slug', slug).single()
    if (!c) { setNotFound(true); setLoading(false); return }
    setClub({ ...c, gallery_photos: c.gallery_photos || [] })
    const id = c.id
    const today = new Date().toISOString().split('T')[0]
    const year  = new Date().getFullYear().toString()

    const [mRes, aRes, achRes, upRes, achListRes, hPhotoRes, aPhotoRes] = await Promise.all([
      sb.from('uco_members').select('id', { count: 'exact', head: true }).eq('club_id', id).in('status', ['active', 'pending']),
      sb.from('uco_activities').select('id', { count: 'exact', head: true }).eq('club_id', id).gte('activity_date', year + '-01-01'),
      sb.from('uco_history').select('id', { count: 'exact', head: true }).eq('club_id', id).in('category', ['Achievement', 'Championship', 'Award', 'Milestone']),
      sb.from('uco_activities').select('id,title,activity_date,location,description,expected_attendance,type').eq('club_id', id).gte('activity_date', today).neq('status', 'cancelled').order('activity_date').limit(3),
      sb.from('uco_history').select('id,title,content,event_date,category,is_milestone').eq('club_id', id).in('category', ['Achievement', 'Championship', 'Award', 'Milestone']).order('event_date', { ascending: false }).limit(8),
      sb.from('uco_history').select('id,title,photos').eq('club_id', id).order('event_date', { ascending: false }).limit(10),
      sb.from('uco_activities').select('id,title,event_photos').eq('club_id', id).order('activity_date', { ascending: false }).limit(10),
    ])

    setMemberCount(mRes.count || 0)
    setActivityCount(aRes.count || 0)
    setAchievementCount(achRes.count || 0)
    setActivities(upRes.data || [])
    setAchievements(achListRes.data || [])

    const clubPics   = (c.gallery_photos || []).map((url: string) => ({ url, title: c.name }))
    const histPics   = (hPhotoRes.data || []).flatMap((h: { title: string; photos: string[] }) => (h.photos || []).map((url: string) => ({ url, title: h.title })))
    const actPics    = (aPhotoRes.data || []).flatMap((a: { title: string; event_photos: string[] }) => (a.event_photos || []).map((url: string) => ({ url, title: a.title })))
    setGallery([...clubPics, ...histPics, ...actPics].slice(0, 24))
    setLoading(false)
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!club || !joinForm.full_name || !joinForm.email) return
    setJoining(true)
    const sb = createClient()
    await sb.from('uco_members').insert({
      club_id: club.id, full_name: joinForm.full_name,
      student_id: joinForm.student_id || null, email: joinForm.email,
      phone: joinForm.phone || null, role: 'Member', position: 'Member', status: 'pending',
      notes: joinForm.motivation || null,
      joined_at: new Date().toISOString().split('T')[0],
      joined_date: new Date().toISOString().split('T')[0],
    })
    setJoining(false); setJoinDone(true)
  }

  function scrollTo(ref: React.RefObject<HTMLElement>) {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // ── Loading ──
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.blue }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: C.red, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 36, color: '#fff', margin: '0 auto 20px', animation: 'pulse 1.5s infinite' }}>U</div>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>Loading...</p>
      </div>
    </div>
  )

  // ── Not found ──
  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.navy, padding: 24 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 96, marginBottom: 24 }}>🏀</div>
        <h1 style={{ color: '#fff', fontSize: 40, fontWeight: 900, marginBottom: 16 }}>Club Not Found</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32 }}>This page doesn&apos;t exist or the link may have changed.</p>
        <a href="https://solo-ai-uniclubos.vercel.app" style={{ display: 'inline-block', padding: '16px 40px', background: C.red, color: '#fff', borderRadius: 12, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
          Back to UniClub OS
        </a>
      </div>
    </div>
  )

  const wa = `https://wa.me/?text=${encodeURIComponent(`Hi! I'd like to join ${club!.name}. Please let me know how to apply!`)}`

  // ── Page ──
  return (
    <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>

      {/* Global styles */}
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .rvl { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .rv  { opacity: 1 !important; transform: translateY(0) !important; }
        .d1  { transition-delay: 0.1s !important; }
        .d2  { transition-delay: 0.2s !important; }
        .d3  { transition-delay: 0.3s !important; }
        .d4  { transition-delay: 0.4s !important; }
        .hov-scale { transition: transform 0.35s ease; }
        .hov-scale:hover { transform: scale(1.04); }
        .hov-btn { transition: filter 0.22s ease, transform 0.22s ease; }
        .hov-btn:hover { filter: brightness(1.12); transform: translateY(-2px); }
        .gal-overlay { opacity: 0; transition: opacity 0.3s ease; }
        .gal-item:hover .gal-overlay { opacity: 1; }
        .stat-cell { transition: background 0.3s ease; }
        .stat-cell:hover { background: rgba(255,107,0,0.1) !important; }
        @keyframes flicker { 0%,100%{opacity:1} 50%{opacity:0.85} }
        .orange-glow { animation: flicker 3s ease-in-out infinite; }
        @media (max-width: 1024px) {
          .lg-grid-2 { grid-template-columns: 1fr !important; }
          .lg-grid-3 { grid-template-columns: 1fr 1fr !important; }
          .lg-grid-4 { grid-template-columns: 1fr 1fr !important; }
          .lg-grid-cta { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .lg-grid-3 { grid-template-columns: 1fr !important; }
          .lg-grid-stat { grid-template-columns: 1fr 1fr !important; }
          .lg-grid-gal { column-count: 2 !important; }
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ═══════════════════════════════════════
          1 — HERO
      ═══════════════════════════════════════ */}
      <section style={{ minHeight: '85vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Background — theme hero image */}
        <div style={{ position: 'absolute', inset: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', position: 'absolute', inset: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          {/* Fallback gradient (shown if image not uploaded yet) */}
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, #0D0D0D 0%, #1a0a00 40%, #0D0D0D 100%)` }} />
          {/* Dark overlay */}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)' }} />
          {/* Orange bottom vignette */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(to bottom, transparent, rgba(13,13,13,0.95))' }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '100px 24px 120px', width: '100%', maxWidth: 960, margin: '0 auto' }}>
          {/* Logo circle */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ width: 120, height: 120, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.88)', boxShadow: '0 8px 40px rgba(0,0,0,0.45)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.blue, flexShrink: 0 }}>
              {club!.logo_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={club!.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: '#fff', fontSize: 52, fontWeight: 900, lineHeight: 1 }}>{club!.name[0]}</span>
              }
            </div>
          </div>

          {/* Category badge */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
            <span style={{ padding: '8px 22px', borderRadius: 999, background: C.red, color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: 0.3 }}>
              🏀 {club!.category || 'Sports'} · Basketball
            </span>
            {club!.founded_year && (
              <span style={{ padding: '8px 18px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                Est. {club!.founded_year}
              </span>
            )}
          </div>

          {/* Club name */}
          <h1 style={{ color: '#fff', fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 14, textShadow: '0 4px 24px rgba(0,0,0,0.4)', letterSpacing: '-1px' }}>
            {club!.name}
          </h1>

          {/* University */}
          {club!.university_name && (
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 'clamp(15px, 2vw, 20px)', marginBottom: 6, fontWeight: 500 }}>
              {club!.university_name}
            </p>
          )}

          {/* CTA buttons */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap', marginTop: 40, marginBottom: 40 }}>
            {club!.allow_join_applications && (
              <button onClick={() => scrollTo(joinRef)} className="hov-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 36px', height: 52, borderRadius: 12, background: C.orange, color: '#fff', fontWeight: 800, fontSize: 17, border: 'none', cursor: 'pointer', boxShadow: `0 8px 32px rgba(255,107,0,0.6)` }}>
                🏅 Join This Club
              </button>
            )}
            <button onClick={() => scrollTo(aboutRef)} className="hov-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '0 32px', height: 52, borderRadius: 12, background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 16, border: '2px solid rgba(255,255,255,0.55)', cursor: 'pointer' }}>
              Learn More <ChevronRight size={18} />
            </button>
          </div>

          {/* Social icons */}
          {(club!.instagram_url || club!.facebook_url || club!.tiktok_url) && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              {club!.instagram_url && (
                <a href={club!.instagram_url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                  <IgIcon size={22} />
                </a>
              )}
              {club!.facebook_url && (
                <a href={club!.facebook_url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                  <FbIcon size={22} />
                </a>
              )}
              {club!.tiktok_url && (
                <a href={club!.tiktok_url} target="_blank" rel="noopener noreferrer"
                  style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', textDecoration: 'none' }}>
                  <TikTokIcon size={22} />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Powered by */}
        <div style={{ position: 'absolute', bottom: 96, right: 32, color: 'rgba(255,255,255,0.25)', fontSize: 12 }}>
          Powered by UniClub OS
        </div>

      </section>

      {/* ═══════════════════════════════════════
          2 — STATS BAR
      ═══════════════════════════════════════ */}
      <section style={{ background: '#0D0D0D', padding: '0 24px 48px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="lg-grid-stat" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderRadius: 20, overflow: 'hidden',
            border: '1px solid rgba(255,107,0,0.45)',
            boxShadow: '0 0 20px rgba(255,107,0,0.25), 0 8px 48px rgba(0,0,0,0.7)',
          }}>
            {[
              { icon: <Users size={36} style={{ color: '#A78BFA' }} />,    val: club!.show_member_count ? memberCount : '—', label: 'Members' },
              { icon: <Calendar size={36} style={{ color: '#60A5FA' }} />,  val: activityCount,     label: 'Events This Year' },
              { icon: <Trophy size={36} style={{ color: C.gold }} />,       val: achievementCount,  label: 'Achievements' },
              { icon: <Camera size={36} style={{ color: '#34D399' }} />,    val: gallery.length,    label: 'Gallery Photos' },
            ].map((s, i) => (
              <div key={i} className={`rvl d${i + 1} stat-cell`} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px',
                borderRight: i < 3 ? '1px solid rgba(255,107,0,0.18)' : undefined,
                textAlign: 'center', background: 'rgba(0,0,0,0.6)',
              }}>
                <div style={{ marginBottom: 16 }}>{s.icon}</div>
                <div style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 900, color: C.white, lineHeight: 1, marginBottom: 10, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 20px rgba(255,107,0,0.4)' }}>{s.val}</div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          3 — ABOUT US
      ═══════════════════════════════════════ */}
      <section ref={aboutRef} style={{ position: 'relative', padding: '90px 24px 90px', minHeight: 400, overflow: 'hidden', background: '#0a0a0a' }}>
        {/* Fire background image */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ABOUT_BG} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left center', position: 'absolute', inset: 0 }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.68)' }} />
          {/* Orange left edge glow */}
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 6, background: 'linear-gradient(to bottom, #FF6B00, #FF4500, #FF6B00)', boxShadow: '0 0 40px rgba(255,107,0,0.8)' }} />
        </div>

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="lg-grid-2" style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 72, alignItems: 'start' }}>
            {/* Left */}
            <div className="rvl">
              {/* Section tag — orange on dark */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 4, height: 32, borderRadius: 2, background: C.orange, flexShrink: 0, boxShadow: '0 0 12px rgba(255,107,0,0.8)' }} />
                <span style={{ color: C.orange, fontWeight: 800, fontSize: 13, letterSpacing: 2.5, textTransform: 'uppercase' as const }}>About Us</span>
              </div>
              <h2 style={{ color: C.white, fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 900, lineHeight: 1.08, marginBottom: 28, letterSpacing: '-0.5px', fontStyle: 'italic', textShadow: '0 2px 20px rgba(255,107,0,0.4)' }}>
                About Our Club
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 17, lineHeight: 1.9, marginBottom: 36 }}>
                {club!.description ||
                  `Welcome to <strong>${club!.name}</strong>! We are a passionate group of students dedicated to our sport, building community, and creating memories that last a lifetime. Join us and be part of something amazing.`
                }
              </p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {club!.show_activities && (
                  <button onClick={() => scrollTo(activitiesRef)} className="hov-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.35)', color: C.white, fontWeight: 700, fontSize: 14, background: 'rgba(255,255,255,0.06)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <Calendar size={15} /> Activities
                  </button>
                )}
                {club!.show_gallery && (
                  <button onClick={() => scrollTo(galleryRef)} className="hov-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 22px', borderRadius: 10, border: `2px solid rgba(255,107,0,0.5)`, color: C.orange, fontWeight: 700, fontSize: 14, background: 'rgba(255,107,0,0.08)', cursor: 'pointer', backdropFilter: 'blur(4px)' }}>
                    <Camera size={15} /> Gallery
                  </button>
                )}
                {club!.allow_join_applications && (
                  <button onClick={() => scrollTo(joinRef)} className="hov-btn"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '11px 26px', borderRadius: 10, background: C.orange, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(255,107,0,0.5)' }}>
                    Join Now <ChevronRight size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Right — Club details card (dark glass) */}
            <div className="rvl d2" style={{ background: 'rgba(15,15,15,0.75)', backdropFilter: 'blur(12px)', borderRadius: 20, overflow: 'hidden', boxShadow: `0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,107,0,0.3)`, border: '1px solid rgba(255,107,0,0.25)' }}>
              <div style={{ padding: '18px 26px', borderBottom: '1px solid rgba(255,107,0,0.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: C.orange, fontWeight: 900, fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' as const }}>CLUB</span>
                <span style={{ color: C.orange, fontWeight: 900, fontSize: 13, letterSpacing: 2, fontStyle: 'italic', textTransform: 'uppercase' as const }}>DETAILS</span>
              </div>
              {[
                { icon: <MapPin size={15} />,   label: 'University',  val: club!.university_name },
                { icon: <Users size={15} />,    label: 'Faculty',     val: club!.faculty },
                { icon: <Mail size={15} />,     label: 'Contact',     val: club!.contact_email },
                { icon: <Phone size={15} />,    label: 'Phone',       val: club!.contact_phone },
                { icon: <Users size={15} />,    label: 'Max Members', val: club!.max_members ? `${club!.max_members} members` : null },
                { icon: <Calendar size={15} />, label: 'Founded',     val: club!.founded_year?.toString() ?? null },
              ].map((row, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 26px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: C.orange, marginTop: 2, flexShrink: 0 }}>{row.icon}</span>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 3px' }}>{row.label}</p>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 14, margin: 0 }}>{row.val || '—'}</p>
                  </div>
                </div>
              ))}
              {(club!.instagram_url || club!.facebook_url || club!.tiktok_url) && (
                <div style={{ padding: '16px 26px', display: 'flex', gap: 10 }}>
                  {club!.instagram_url && (
                    <a href={club!.instagram_url} target="_blank" rel="noopener noreferrer"
                      style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, textDecoration: 'none' }}>
                      <IgIcon size={18} />
                    </a>
                  )}
                  {club!.facebook_url && (
                    <a href={club!.facebook_url} target="_blank" rel="noopener noreferrer"
                      style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, textDecoration: 'none' }}>
                      <FbIcon size={18} />
                    </a>
                  )}
                  {club!.tiktok_url && (
                    <a href={club!.tiktok_url} target="_blank" rel="noopener noreferrer"
                      style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,107,0,0.15)', border: '1px solid rgba(255,107,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.orange, textDecoration: 'none' }}>
                      <TikTokIcon size={18} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          4 — UPCOMING ACTIVITIES
      ═══════════════════════════════════════ */}
      {club!.show_activities && (
        <section ref={activitiesRef} style={{ background: C.gray, padding: '80px 24px', minHeight: 400 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="rvl" style={{ marginBottom: 48 }}>
              <SectionTag>Calendar</SectionTag>
              <h2 style={{ color: C.blue, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.5px' }}>
                What&apos;s Coming Up
              </h2>
            </div>

            <div className="lg-grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {activities.length === 0
                ? [1, 2, 3].map(i => (
                    <div key={i} className="rvl" style={{ background: '#fff', borderRadius: 14, border: '2px dashed #DDD', minHeight: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 36, textAlign: 'center' }}>
                      <Calendar size={44} style={{ color: '#CCC', marginBottom: 16 }} />
                      <p style={{ fontWeight: 700, color: '#BBB', fontSize: 17, marginBottom: 8 }}>Activities Coming Soon!</p>
                      <p style={{ color: '#CCC', fontSize: 14 }}>Check back for upcoming events.</p>
                    </div>
                  ))
                : activities.map((act, i) => {
                    const col = activityColor(act.type)
                    return (
                      <div key={act.id} className="rvl" style={{ transitionDelay: `${i * 0.12}s`, background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', minHeight: 240 }}>
                        <div style={{ height: 6, background: col }} />
                        <div style={{ padding: 28 }}>
                          <span style={{ display: 'inline-block', padding: '4px 14px', borderRadius: 999, background: `${col}18`, color: col, fontWeight: 700, fontSize: 12, marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                            {act.type || 'Event'}
                          </span>
                          <h3 style={{ fontWeight: 800, color: C.dark, fontSize: 20, lineHeight: 1.3, marginBottom: 16 }}>{act.title}</h3>
                          {act.description && (
                            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, marginBottom: 14, overflow: 'hidden', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                              {act.description}
                            </p>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 14 }}>
                              <Clock size={14} style={{ color: col }} /> {fmtDate(act.activity_date)}
                            </div>
                            {act.location && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 14 }}>
                                <MapPin size={14} style={{ color: col }} /> {act.location}
                              </div>
                            )}
                            {act.expected_attendance && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#888', fontSize: 14 }}>
                                <Users size={14} style={{ color: col }} /> {act.expected_attendance} spots
                              </div>
                            )}
                          </div>
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="hov-btn"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: '13px', borderRadius: 10, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
                            💬 RSVP via WhatsApp
                          </a>
                        </div>
                      </div>
                    )
                  })
              }
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          5 — HALL OF FAME
      ═══════════════════════════════════════ */}
      <section style={{ background: C.navy, padding: '80px 24px', minHeight: 400 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div className="rvl" style={{ marginBottom: 48 }}>
            <SectionTag>Hall of Fame</SectionTag>
            <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.5px' }}>
              Our Achievements
            </h2>
          </div>

          <div className="lg-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {achievements.length === 0
              ? [1, 2, 3, 4].map(i => (
                  <div key={i} className="rvl" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, minHeight: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 28, textAlign: 'center' }}>
                    <div style={{ fontSize: 52, marginBottom: 14 }}>🏆</div>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.65 }}>
                      Your achievements<br />will be showcased here.
                    </p>
                  </div>
                ))
              : achievements.map((ach, i) => (
                  <div key={ach.id} className="rvl" style={{ transitionDelay: `${i * 0.1}s`, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, minHeight: 200, padding: 28 }}>
                    <div style={{ fontSize: 56, lineHeight: 1, marginBottom: 18 }}>{trophyIcon(ach.category, ach.is_milestone)}</div>
                    <div style={{ color: C.red, fontWeight: 800, fontSize: 12, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>
                      {ach.category} · {ach.event_date.split('-')[0]}
                    </div>
                    <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 17, lineHeight: 1.3, marginBottom: 10 }}>{ach.title}</h3>
                    {ach.content && (
                      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, lineHeight: 1.65, overflow: 'hidden', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                        {ach.content}
                      </p>
                    )}
                  </div>
                ))
            }
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          6 — GALLERY
      ═══════════════════════════════════════ */}
      {club!.show_gallery && (
        <section ref={galleryRef} style={{ background: C.white, padding: '80px 24px', minHeight: 400 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="rvl" style={{ marginBottom: 48 }}>
              <SectionTag>Gallery</SectionTag>
              <h2 style={{ color: C.blue, fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.5px' }}>
                Our Moments
              </h2>
            </div>

            {/* Masonry */}
            <div className="lg-grid-gal rvl" style={{ columns: '3 260px', columnGap: 12, marginBottom: 48 }}>
              {gallery.length === 0
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="gal-item" style={{ breakInside: 'avoid', marginBottom: 12, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ background: '#F0F0F0', height: [280, 210, 250, 230, 270, 200][i], display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                        <Camera size={32} style={{ color: '#CCC' }} />
                        <p style={{ color: '#CCC', fontSize: 13, fontWeight: 600 }}>Photos will appear here</p>
                      </div>
                    </div>
                  ))
                : gallery.map((photo, i) => (
                    <div key={i} className="gal-item" style={{ breakInside: 'avoid', marginBottom: 12, borderRadius: 10, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                      onClick={() => setLightbox(photo)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.title} className="hov-scale" style={{ width: '100%', display: 'block', objectFit: 'cover' }} />
                      <div className="gal-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', padding: 14 }}>
                        <p style={{ color: '#fff', fontWeight: 700, fontSize: 14, lineHeight: 1.3 }}>{photo.title}</p>
                      </div>
                    </div>
                  ))
              }
            </div>

            <div style={{ textAlign: 'center' }}>
              <button className="hov-btn"
                style={{ padding: '14px 48px', borderRadius: 12, border: `2px solid ${C.blue}`, color: C.blue, fontWeight: 700, fontSize: 16, background: 'transparent', cursor: 'pointer' }}>
                View All Photos
              </button>
            </div>
          </div>

          {/* Lightbox */}
          {lightbox && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.93)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
              onClick={() => setLightbox(null)}>
              <button style={{ position: 'absolute', top: 20, right: 20, width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={22} />
              </button>
              <div style={{ maxWidth: 1000, width: '100%' }} onClick={e => e.stopPropagation()}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={lightbox.url} alt={lightbox.title} style={{ width: '100%', maxHeight: '85vh', objectFit: 'contain', borderRadius: 14 }} />
                <p style={{ color: '#fff', textAlign: 'center', marginTop: 16, fontWeight: 600, fontSize: 16 }}>{lightbox.title}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════
          7 — JOIN CTA
      ═══════════════════════════════════════ */}
      {club!.allow_join_applications && (
        <section ref={joinRef} style={{ background: C.red, padding: '80px 24px', minHeight: 400, position: 'relative', overflow: 'hidden' }}>
          <BasketballBg />
          <div className="lg-grid-cta" style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 80, alignItems: 'center' }}>
            {/* Copy */}
            <div className="rvl">
              <p style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 800, fontSize: 13, letterSpacing: 2.5, textTransform: 'uppercase', marginBottom: 20 }}>Ready to join?</p>
              <h2 style={{ color: '#fff', fontSize: 'clamp(28px, 3.5vw, 52px)', fontWeight: 900, lineHeight: 1.12, letterSpacing: '-0.5px', marginBottom: 24 }}>
                Want to be part of<br />
                <span style={{ opacity: 0.85 }}>{club!.name}?</span>
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.82)', fontSize: 18, lineHeight: 1.8, marginBottom: 36 }}>
                Apply now and our captain will get back to you.<br />
                We welcome all passionate members who share<br />
                our love for the sport!
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {['✅  Free to apply', '⚡  Quick response', '❤️  All skill levels welcome'].map(t => (
                  <div key={t} style={{ color: 'rgba(255,255,255,0.92)', fontSize: 16, fontWeight: 600 }}>{t}</div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div className="rvl d2">
              <div style={{ background: '#fff', borderRadius: 20, padding: 36, boxShadow: '0 32px 80px rgba(0,0,0,0.25)' }}>
                {joinDone ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <CheckCircle size={64} style={{ color: '#10B981', margin: '0 auto 20px', display: 'block' }} />
                    <h3 style={{ color: C.blue, fontWeight: 900, fontSize: 24, marginBottom: 14 }}>Application Submitted! 🎉</h3>
                    <p style={{ color: '#888', lineHeight: 1.75, fontSize: 15 }}>
                      We&apos;ll review your application<br />and get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submitJoin}>
                    <h3 style={{ color: C.blue, fontWeight: 900, fontSize: 22, marginBottom: 24 }}>Join Application</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {/* Full name */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>Full Name *</label>
                        <input required placeholder="Your full name"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                          value={joinForm.full_name} onChange={e => setJoinForm(p => ({ ...p, full_name: e.target.value }))} />
                      </div>
                      {/* Student ID + Phone */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>Student ID *</label>
                          <input required placeholder="2024001234"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                            value={joinForm.student_id} onChange={e => setJoinForm(p => ({ ...p, student_id: e.target.value }))} />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>Phone</label>
                          <input placeholder="+60 12-345 6789"
                            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                            value={joinForm.phone} onChange={e => setJoinForm(p => ({ ...p, phone: e.target.value }))} />
                        </div>
                      </div>
                      {/* Email */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>Email *</label>
                        <input required type="email" placeholder="student@university.edu.my"
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', fontFamily: 'inherit' }}
                          value={joinForm.email} onChange={e => setJoinForm(p => ({ ...p, email: e.target.value }))} />
                      </div>
                      {/* Motivation */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 7 }}>Why do you want to join?</label>
                        <textarea placeholder="Tell us about yourself..." rows={3}
                          style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E5E7EB', fontSize: 15, outline: 'none', resize: 'none', fontFamily: 'inherit' }}
                          value={joinForm.motivation} onChange={e => setJoinForm(p => ({ ...p, motivation: e.target.value }))} />
                      </div>
                      {/* Submit */}
                      <button type="submit" disabled={joining} className="hov-btn"
                        style={{ width: '100%', padding: 16, borderRadius: 12, background: C.blue, color: '#fff', fontWeight: 800, fontSize: 16, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        {joining ? 'Submitting...' : <><span>Submit Application</span> <ChevronRight size={18} /></>}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════ */}
      <footer style={{ background: C.dark }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 0' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 48, paddingBottom: 48, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: C.blue, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {club!.logo_url
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={club!.logo_url} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: '#fff', fontWeight: 900, fontSize: 22 }}>{club!.name[0]}</span>
                  }
                </div>
                <div>
                  <p style={{ color: '#fff', fontWeight: 900, fontSize: 18, lineHeight: 1.2 }}>{club!.name}</p>
                  {club!.university_name && <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>{club!.university_name}</p>}
                </div>
              </div>
              {club!.description && (
                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 14, lineHeight: 1.7, maxWidth: 400, overflow: 'hidden', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}>
                  {club!.description}
                </p>
              )}
            </div>
            {/* Quick links */}
            <div>
              <h4 style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>Explore</h4>
              <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'About',      ref: aboutRef },
                  ...(club!.show_activities     ? [{ label: 'Activities', ref: activitiesRef }] : []),
                  ...(club!.show_gallery         ? [{ label: 'Gallery',    ref: galleryRef    }] : []),
                  ...(club!.allow_join_applications ? [{ label: 'Join Us',  ref: joinRef       }] : []),
                ].map(lnk => (
                  <li key={lnk.label}>
                    <button onClick={() => scrollTo(lnk.ref)}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 15, fontWeight: 600, cursor: 'pointer', padding: 0, transition: 'color 0.2s' }}>
                      {lnk.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        {/* Bottom bar */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 13 }}>© {new Date().getFullYear()} {club!.name}. All rights reserved.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <a href="/admin-login" style={{ color: 'rgba(255,255,255,0.14)', fontSize: 12, textDecoration: 'none' }}>Admin Login</a>
            <a href="https://solo-ai-uniclubos.vercel.app" target="_blank" rel="noopener noreferrer"
              style={{ color: 'rgba(255,255,255,0.28)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
              Powered by UniClub OS 🔗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
