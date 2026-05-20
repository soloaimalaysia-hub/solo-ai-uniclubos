'use client'

import Link from 'next/link'
import {
  Users, Calendar, DollarSign, Bell, BookOpen, BarChart3,
  CheckCircle, ArrowRight, Menu, X, ChevronRight, Star,
  Shield, Zap, Globe, Building2, Award, TrendingUp
} from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Universities', href: '#universities' },
  { label: 'Pricing', href: '#pricing' },
]

const PAIN_POINTS = [
  { icon: '📋', title: 'Member records in Excel?', desc: 'Lost files, duplicates, no version control. One crash and everything is gone.' },
  { icon: '💸', title: 'Finance tracked in notebooks?', desc: 'No transparency, audit trails, or real-time visibility on club funds.' },
  { icon: '📢', title: 'Announcements via WhatsApp?', desc: 'Important notices buried under memes. New members miss critical info.' },
  { icon: '📅', title: 'Activities managed via memory?', desc: 'Double-bookings, forgotten events, and zero attendance tracking.' },
]

const FEATURES = [
  {
    icon: Users,
    color: '#1E3A8A',
    title: 'Member Management',
    desc: 'Complete member directory with roles, join dates, attendance history, and contact info. Add/remove members instantly.',
  },
  {
    icon: Calendar,
    color: '#F97316',
    title: 'Activity Calendar',
    desc: 'Plan and track all club activities. Send invites, record attendance, and generate post-event summaries automatically.',
  },
  {
    icon: DollarSign,
    color: '#10B981',
    title: 'Finance Tracker',
    desc: 'Log income and expenses, generate financial reports, and maintain full transparency with your committee and advisor.',
  },
  {
    icon: Bell,
    color: '#8B5CF6',
    title: 'Announcements',
    desc: 'Push official announcements to all members. Pin important notices. Never lose a message in a group chat again.',
  },
  {
    icon: BookOpen,
    color: '#F59E0B',
    title: 'Club History',
    desc: "Build a living archive of your club's journey — milestones, past events, and achievements preserved forever.",
  },
  {
    icon: BarChart3,
    color: '#EF4444',
    title: 'Analytics Dashboard',
    desc: 'See membership growth, activity participation rates, and financial health at a glance. Make data-driven decisions.',
  },
]

const HOW_IT_WORKS = [
  { step: '01', title: 'Sign Up Your Club', desc: 'Register your university and club in 2 minutes. No credit card required to start.' },
  { step: '02', title: 'Import Your Members', desc: 'Add members manually or import from Excel. Roles and profiles set up instantly.' },
  { step: '03', title: 'Run Everything Here', desc: 'Activities, finance, announcements — all managed from one clean dashboard.' },
  { step: '04', title: 'Grow With Data', desc: 'Track trends, generate reports for advisors, and plan smarter each semester.' },
]

const TESTIMONIALS = [
  {
    name: 'Ahmad Hafiz',
    role: 'President, USJ Basketball Club',
    uni: 'Universiti Malaya',
    quote: 'Finally, no more WhatsApp chaos. Our entire club runs on UniClub OS now.',
    stars: 5,
  },
  {
    name: 'Priya Menon',
    role: 'Treasurer, Debate Society',
    uni: 'Universiti Putra Malaysia',
    quote: 'The finance tracker alone saved us 3 hours every week. Our advisor loves the transparency.',
    stars: 5,
  },
  {
    name: 'James Lim',
    role: 'Secretary, Photography Club',
    uni: 'Universiti Teknologi Malaysia',
    quote: "Our club history is now properly documented. New members can see everything we've achieved.",
    stars: 5,
  },
]

const UNIVERSITY_BENEFITS = [
  { icon: Shield, title: 'Full Oversight', desc: 'University administrators get a bird\'s-eye view of all clubs on campus.' },
  { icon: Zap, title: 'Instant Compliance', desc: 'Standardised reporting makes audits and accreditation simple.' },
  { icon: Globe, title: 'Cross-Campus Events', desc: 'Enable inter-university collaborations and joint activities seamlessly.' },
  { icon: Award, title: 'Club Recognition', desc: 'Built-in achievement tracking for annual club awards and recognition.' },
]

export default function LandingPage() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b border-uco-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-black text-sm"
                style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>U</div>
              <span className="font-black text-lg text-uco-text">UniClub <span style={{ color: '#1E3A8A' }}>OS</span></span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              {NAV_LINKS.map(l => (
                <a key={l.label} href={l.href}
                  className="text-sm font-medium text-uco-text-muted hover:text-uco-blue transition-colors">{l.label}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/admin-login" className="text-sm font-semibold text-uco-blue hover:text-uco-blue-dark transition-colors">
                Log in
              </Link>
              <Link href="/register" className="btn-primary text-sm">
                Get Started Free
              </Link>
            </div>
            <button className="md:hidden p-2 rounded-lg hover:bg-uco-surface"
              onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <div className="md:hidden border-t border-uco-border bg-white px-4 py-4 space-y-3">
            {NAV_LINKS.map(l => (
              <a key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
                className="block text-sm font-medium text-uco-text py-2">{l.label}</a>
            ))}
            <Link href="/register" className="btn-primary w-full justify-center mt-3 block text-center">
              Get Started Free
            </Link>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section className="pt-24 pb-20 px-4 sm:px-6 lg:px-8" style={{ background: 'linear-gradient(160deg, #EFF6FF 0%, #FFFFFF 50%, #FFF7ED 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
              style={{ background: 'rgba(30,58,138,0.08)', color: '#1E3A8A' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-uco-blue animate-pulse inline-block" />
              Now available for Malaysian universities
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-uco-text leading-tight mb-6">
              Run Your University Club{' '}
              <span style={{ color: '#1E3A8A' }}>Like a Pro</span>
            </h1>
            <p className="text-lg sm:text-xl text-uco-text-muted leading-relaxed mb-8 max-w-2xl mx-auto">
              Stop managing your club on WhatsApp and Excel. UniClub OS gives you a complete dashboard for members, activities, finance, and announcements — all in one place.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="btn-primary text-base px-7 py-3.5 gap-2 inline-flex justify-center">
                Start Free Today <ArrowRight size={18} />
              </Link>
              <a href="#features" className="btn-outline text-base px-7 py-3.5 inline-flex justify-center">
                See Features
              </a>
            </div>
            <p className="text-xs text-uco-text-muted mt-4">No credit card required &bull; Free for small clubs &bull; Setup in 2 minutes</p>
          </div>

          {/* Hero visual */}
          <div className="mt-16 max-w-5xl mx-auto">
            <div className="rounded-2xl overflow-hidden shadow-2xl border border-uco-border" style={{ background: '#F8FAFC' }}>
              <div className="bg-white border-b border-uco-border px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="flex-1 mx-4">
                  <div className="bg-uco-surface rounded-lg px-4 py-1.5 text-xs text-uco-text-muted text-center">
                    uniclubos.vercel.app/admin/dashboard
                  </div>
                </div>
              </div>
              <div className="flex min-h-[320px]">
                <div className="w-48 hidden sm:flex flex-col p-4 gap-1" style={{ background: '#1E3A8A' }}>
                  <div className="text-white font-black text-sm mb-4 px-2">UniClub OS</div>
                  {['Dashboard', 'Members', 'Activities', 'Finance', 'History', 'Announcements'].map((item, i) => (
                    <div key={item} className={`px-3 py-2 rounded-lg text-xs font-medium ${i === 0 ? 'bg-white/20 text-white' : 'text-white/60'}`}>
                      {item}
                    </div>
                  ))}
                </div>
                <div className="flex-1 p-6">
                  <div className="text-sm font-bold text-uco-text mb-4">Good morning, Captain Kenny 👋</div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                    {[
                      { label: 'Total Members', value: '48', color: '#1E3A8A' },
                      { label: 'This Month Activities', value: '6', color: '#F97316' },
                      { label: 'Club Balance', value: 'RM 2,450', color: '#10B981' },
                      { label: 'Announcements', value: '3 new', color: '#8B5CF6' },
                    ].map(stat => (
                      <div key={stat.label} className="bg-white rounded-xl p-3 border border-uco-border">
                        <div className="text-xs text-uco-text-muted">{stat.label}</div>
                        <div className="text-lg font-black mt-0.5" style={{ color: stat.color }}>{stat.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-4 border border-uco-border">
                      <div className="text-xs font-bold text-uco-text-muted mb-3">UPCOMING ACTIVITIES</div>
                      {['Training Session — Sat 24 May', 'AGM Meeting — Mon 26 May', 'Charity Run — Sat 31 May'].map(ev => (
                        <div key={ev} className="flex items-center gap-2 py-1.5 border-b border-uco-border last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#F97316' }} />
                          <span className="text-xs text-uco-text">{ev}</span>
                        </div>
                      ))}
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-uco-border">
                      <div className="text-xs font-bold text-uco-text-muted mb-3">RECENT MEMBERS</div>
                      {['Ahmad Hafiz — Captain', 'Priya Menon — Treasurer', 'James Lim — Secretary'].map(m => (
                        <div key={m} className="flex items-center gap-2 py-1.5 border-b border-uco-border last:border-0">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: 'rgba(30,58,138,0.1)', color: '#1E3A8A' }}>{m[0]}</div>
                          <span className="text-xs text-uco-text">{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-uco-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-3">Sound familiar?</h2>
            <p className="text-uco-text-muted text-lg max-w-xl mx-auto">Most clubs are still stuck with outdated tools. It does not have to be this way.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PAIN_POINTS.map(p => (
              <div key={p.title} className="bg-white rounded-2xl p-6 border border-red-100 shadow-sm">
                <div className="text-3xl mb-3">{p.icon}</div>
                <h3 className="font-bold text-uco-text mb-2">{p.title}</h3>
                <p className="text-sm text-uco-text-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="badge-blue mb-3 inline-block">Everything You Need</span>
            <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-3">One platform. All club operations.</h2>
            <p className="text-uco-text-muted text-lg max-w-xl mx-auto">Purpose-built for university clubs in Malaysia. No bloat, no complexity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="rounded-2xl p-6 border border-uco-border hover:shadow-lg hover:-translate-y-0.5 transition-all bg-white">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: `${f.color}15` }}>
                    <Icon size={22} style={{ color: f.color }} />
                  </div>
                  <h3 className="font-bold text-uco-text text-lg mb-2">{f.title}</h3>
                  <p className="text-sm text-uco-text-muted leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8"
        style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1e2f6b 100%)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">Get started in minutes</h2>
            <p className="text-blue-200 text-lg max-w-xl mx-auto">No training needed. If you can use a smartphone, you can run UniClub OS.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map((step) => (
              <div key={step.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 font-black text-2xl"
                  style={{ background: 'rgba(255,255,255,0.12)', color: '#F97316', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {step.step}
                </div>
                <h3 className="font-bold text-white text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-blue-200 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-uco-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-3">Loved by club leaders</h2>
            <p className="text-uco-text-muted text-lg">Real feedback from real university clubs across Malaysia.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-6 border border-uco-border shadow-sm">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <Star key={i} size={14} fill="#F97316" stroke="none" />
                  ))}
                </div>
                <p className="text-uco-text text-sm leading-relaxed mb-4 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3 pt-3 border-t border-uco-border">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: '#1E3A8A' }}>{t.name[0]}</div>
                  <div>
                    <div className="font-semibold text-sm text-uco-text">{t.name}</div>
                    <div className="text-xs text-uco-text-muted">{t.role}</div>
                    <div className="text-xs font-medium" style={{ color: '#1E3A8A' }}>{t.uni}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOR UNIVERSITIES */}
      <section id="universities" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="badge-orange mb-4 inline-block">For Universities</span>
              <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-4">
                Give your university<br />full visibility
              </h2>
              <p className="text-uco-text-muted text-lg leading-relaxed mb-8">
                UniClub OS is not just for club captains. Universities get a master dashboard to oversee every club on campus — compliance, reporting, and cross-club events all handled.
              </p>
              <div className="space-y-4">
                {UNIVERSITY_BENEFITS.map(b => {
                  const Icon = b.icon
                  return (
                    <div key={b.title} className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(30,58,138,0.08)' }}>
                        <Icon size={18} style={{ color: '#1E3A8A' }} />
                      </div>
                      <div>
                        <div className="font-semibold text-uco-text">{b.title}</div>
                        <div className="text-sm text-uco-text-muted mt-0.5">{b.desc}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="rounded-2xl p-8 text-white"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>
              <Building2 size={32} className="mb-6 opacity-80" />
              <h3 className="text-2xl font-black mb-4">University Partnership</h3>
              <p className="text-blue-200 leading-relaxed mb-6">
                Roll out UniClub OS across all faculties. Standardise club operations university-wide, reduce admin burden, and empower student leaders.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Centralised club directory',
                  'Bulk member management',
                  'Cross-club event coordination',
                  'Automated compliance reports',
                  'Custom branding per faculty',
                ].map(item => (
                  <li key={item} className="flex items-center gap-2 text-sm text-blue-100">
                    <CheckCircle size={16} style={{ color: '#F97316', flexShrink: 0 }} />
                    {item}
                  </li>
                ))}
              </ul>
              <a href="mailto:hello@uniclubos.com" className="btn-orange text-sm inline-flex items-center gap-2">
                Contact Us <ChevronRight size={16} />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-uco-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-3">Simple, transparent pricing</h2>
            <p className="text-uco-text-muted text-lg">Start free. Scale when your club grows.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                sub: 'Forever free',
                features: ['Up to 30 members', 'Activities calendar', 'Basic finance tracker', 'Announcements', 'Club history'],
                cta: 'Get Started',
                featured: false,
              },
              {
                name: 'Club Pro',
                price: 'RM 29',
                sub: 'per month',
                features: ['Unlimited members', 'Advanced analytics', 'Finance reports (PDF)', 'Priority support', 'Custom club branding', 'Attendance QR codes'],
                cta: 'Start Free Trial',
                featured: true,
              },
              {
                name: 'University',
                price: 'Custom',
                sub: 'contact us',
                features: ['All Pro features', 'Multi-club dashboard', 'University branding', 'SSO / Student ID login', 'API access', 'Dedicated onboarding'],
                cta: 'Contact Sales',
                featured: false,
              },
            ].map(plan => (
              <div key={plan.name} className={`rounded-2xl p-7 border transition-all ${plan.featured
                ? 'border-uco-blue shadow-xl scale-105'
                : 'border-uco-border bg-white'}`}
                style={plan.featured ? { background: 'linear-gradient(160deg, #1E3A8A 0%, #2563EB 100%)' } : {}}>
                {plan.featured && (
                  <span className="badge-orange mb-3 inline-block">Most Popular</span>
                )}
                <div className="mb-1 font-bold text-sm" style={{ color: plan.featured ? 'rgba(255,255,255,0.7)' : '#64748B' }}>{plan.name}</div>
                <div className="text-4xl font-black mb-0.5" style={{ color: plan.featured ? '#fff' : '#1E293B' }}>{plan.price}</div>
                <div className="text-sm mb-6" style={{ color: plan.featured ? 'rgba(255,255,255,0.55)' : '#94A3B8' }}>{plan.sub}</div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: plan.featured ? 'rgba(255,255,255,0.85)' : '#475569' }}>
                      <CheckCircle size={14} style={{ color: plan.featured ? '#F97316' : '#10B981', flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register"
                  className={`block text-center px-5 py-3 rounded-xl font-bold text-sm transition-all ${plan.featured
                    ? 'bg-white hover:bg-blue-50'
                    : 'text-white hover:opacity-90'}`}
                  style={plan.featured ? { color: '#1E3A8A' } : { background: '#1E3A8A' }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <TrendingUp size={40} className="mx-auto mb-6" style={{ color: '#1E3A8A' }} />
          <h2 className="text-3xl sm:text-4xl font-black text-uco-text mb-4">
            Ready to level up your club?
          </h2>
          <p className="text-uco-text-muted text-lg mb-8 max-w-xl mx-auto">
            Join university clubs across Malaysia who have switched to UniClub OS. Free to start.
          </p>
          <Link href="/register" className="btn-primary text-base px-8 py-4 gap-2 inline-flex items-center">
            Get Started for Free <ArrowRight size={18} />
          </Link>
          <p className="text-xs text-uco-text-muted mt-4">No credit card &bull; Setup in 2 minutes &bull; Cancel anytime</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-uco-border bg-uco-surface">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
                style={{ background: '#1E3A8A' }}>U</div>
              <span className="font-black text-uco-text">UniClub <span style={{ color: '#1E3A8A' }}>OS</span></span>
            </div>
            <div className="flex gap-6 text-sm text-uco-text-muted">
              <a href="#features" className="hover:text-uco-blue transition-colors">Features</a>
              <a href="#pricing" className="hover:text-uco-blue transition-colors">Pricing</a>
              <a href="mailto:hello@uniclubos.com" className="hover:text-uco-blue transition-colors">Contact</a>
              <Link href="/admin-login" className="hover:text-uco-blue transition-colors">Login</Link>
            </div>
            <p className="text-xs text-uco-text-muted">&copy; 2025 UniClub OS. Built by DurianTech.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
