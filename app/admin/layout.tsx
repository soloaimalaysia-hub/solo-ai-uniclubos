'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Users, Calendar, DollarSign,
  BookOpen, Bell, Settings, LogOut, Menu, X, ChevronRight, Globe
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'

const NAV_ITEMS = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/members', icon: Users, label: 'Members' },
  { href: '/admin/activities', icon: Calendar, label: 'Activities' },
  { href: '/admin/finance', icon: DollarSign, label: 'Finance' },
  { href: '/admin/history', icon: BookOpen, label: 'History' },
  { href: '/admin/announcements', icon: Bell, label: 'Announcements' },
  { href: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, setUser } = useAppStore()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [checking, setChecking] = useState(true)
  const [clubSlug, setClubSlug] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/admin-login')
        return
      }
      // Always fetch fresh profile from DB (ensures club_id is up to date)
      const { data: profile } = await supabase
        .from('uco_users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUser({
          ...profile,
          full_name: profile.full_name || profile.name || session.user.email,
        })
        if (profile.club_id) {
          const { data: clubData } = await supabase
            .from('uco_clubs').select('slug').eq('id', profile.club_id).single()
          if (clubData?.slug) setClubSlug(clubData.slug)
        }
      } else {
        // Auto-create profile for first-time admin login
        const newProfile = {
          id: session.user.id,
          email: session.user.email,
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          platform_role: 'super_admin',
        }
        await supabase.from('uco_users').upsert(newProfile)
        setUser(newProfile)
      }
      setChecking(false)
    }
    checkAuth()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    router.push('/admin-login')
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-uco-surface">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black mx-auto mb-3"
            style={{ background: '#1E3A8A' }}>U</div>
          <p className="text-sm text-uco-text-muted">Loading...</p>
        </div>
      </div>
    )
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside className={`flex flex-col ${mobile ? 'w-full' : 'w-60 min-h-screen sticky top-0'} bg-uco-blue`}>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-white text-sm">U</div>
            <div>
              <p className="text-white font-black text-sm leading-none">UniClub OS</p>
              <p className="text-blue-300 text-xs mt-0.5">Admin Panel</p>
            </div>
          </div>
          {mobile && (
            <button onClick={() => setMobileSidebarOpen(false)} className="text-white/60 hover:text-white p-1">
              <X size={18} />
            </button>
          )}
        </div>
        {user?.full_name && (
          <div className="mt-3 px-2 py-2 rounded-lg bg-white/10">
            <p className="text-white text-xs font-semibold truncate">{user.full_name}</p>
            <p className="text-blue-300 text-xs truncate">{user.email}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              onClick={() => mobile && setMobileSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-white/10'
              }`}>
              <Icon size={17} className="flex-shrink-0" />
              {item.label}
              {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
            </Link>
          )
        })}
      </nav>

      {/* View Public Page + Logout */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1">
        {clubSlug && (
          <a href={`/club/${clubSlug}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-200 hover:text-white hover:bg-white/10 w-full transition-colors">
            <Globe size={17} />
            View Public Page
          </a>
        )}
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-blue-200 hover:text-red-300 hover:bg-red-400/10 w-full transition-colors">
          <LogOut size={17} />
          Logout
        </button>
      </div>
    </aside>
  )

  return (
    <div className="flex min-h-screen bg-uco-surface">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMobileSidebarOpen(false)} />
          <div className="w-64 flex-shrink-0">
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden bg-white border-b border-uco-border px-4 py-3 flex items-center gap-3 sticky top-0 z-40">
          <button onClick={() => setMobileSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-uco-surface">
            <Menu size={20} className="text-uco-text" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-uco-blue flex items-center justify-center text-white font-black text-xs">U</div>
            <span className="font-bold text-sm text-uco-text">UniClub OS</span>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
