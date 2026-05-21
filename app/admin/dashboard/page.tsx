'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Users, Calendar, DollarSign, Bell, TrendingUp, Clock, ArrowUpRight, AlertTriangle, CheckCircle } from 'lucide-react'
import Link from 'next/link'

interface Stats {
  members: number
  pending: number
  activities: number
  balance: number
  announcements: number
}

interface PendingApproval {
  module: string
  count: number
}

interface Activity {
  id: string
  title: string
  activity_date: string
  location: string | null
  status: string
}

interface Member {
  id: string
  full_name: string
  role: string
  joined_at: string
}

export default function DashboardPage() {
  const { user } = useAppStore()
  const [stats, setStats] = useState<Stats>({ members: 0, pending: 0, activities: 0, balance: 0, announcements: 0 })
  const [upcoming, setUpcoming] = useState<Activity[]>([])
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait until user is loaded from DB before fetching dashboard data
    if (user !== null && user !== undefined) loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  async function loadData() {
    const supabase = createClient()
    const clubId = user?.club_id
    const today = new Date().toISOString().split('T')[0]

    try {
      // IMPORTANT: .eq() must come AFTER .select() — apply club filter inline
      let membersCountQ = supabase.from('uco_members').select('id', { count: 'exact', head: true })
      if (clubId) membersCountQ = membersCountQ.eq('club_id', clubId)

      let pendingCountQ = supabase.from('uco_members').select('id', { count: 'exact', head: true }).eq('status', 'pending')
      if (clubId) pendingCountQ = pendingCountQ.eq('club_id', clubId)

      let activitiesCountQ = supabase.from('uco_activities').select('id', { count: 'exact', head: true }).gte('activity_date', today)
      if (clubId) activitiesCountQ = activitiesCountQ.eq('club_id', clubId)

      let financeQ = supabase.from('uco_finance').select('amount, type')
      if (clubId) financeQ = financeQ.eq('club_id', clubId)

      let announcementsCountQ = supabase.from('uco_announcements').select('id', { count: 'exact', head: true }).eq('is_pinned', true)
      if (clubId) announcementsCountQ = announcementsCountQ.eq('club_id', clubId)

      let upcomingQ = supabase.from('uco_activities').select('id,title,activity_date,location,status').gte('activity_date', today).order('activity_date').limit(5)
      if (clubId) upcomingQ = upcomingQ.eq('club_id', clubId)

      let recentQ = supabase.from('uco_members').select('id,full_name,role,joined_at').order('joined_at', { ascending: false }).limit(5)
      if (clubId) recentQ = recentQ.eq('club_id', clubId)

      // Pending approvals across all modules
      let approvalsQ = supabase.from('uco_approvals').select('module').eq('status', 'pending')
      if (clubId) approvalsQ = approvalsQ.eq('club_id', clubId)

      const [membersRes, pendingRes, activitiesRes, financeRes, announcementsRes, upcomingRes, recentRes, approvalsRes] = await Promise.all([
        membersCountQ, pendingCountQ, activitiesCountQ, financeQ, announcementsCountQ, upcomingQ, recentQ, approvalsQ,
      ])

      const transactions: { type: string; amount: number }[] = financeRes.data || []
      const balance = transactions.reduce((sum: number, t) => {
        return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount))
      }, 0)

      setStats({
        members: membersRes.count || 0,
        pending: pendingRes.count || 0,
        activities: activitiesRes.count || 0,
        balance,
        announcements: announcementsRes.count || 0,
      })
      // Aggregate pending approvals by module
      const approvalRows: { module: string }[] = approvalsRes.data || []
      const approvalMap: Record<string, number> = {}
      approvalRows.forEach(r => { approvalMap[r.module] = (approvalMap[r.module] || 0) + 1 })
      const approvalList = Object.entries(approvalMap).map(([module, count]) => ({ module, count }))
      setPendingApprovals(approvalList)

      setUpcoming(upcomingRes.data || [])
      setRecentMembers(recentRes.data || [])
    } catch (err) {
      console.error('Dashboard loadData error:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { label: 'Total Members', value: stats.members.toString(), icon: Users, color: '#1E3A8A', href: '/admin/members', change: stats.pending > 0 ? `${stats.pending} pending approval` : 'All members' },
    { label: 'Upcoming Activities', value: stats.activities.toString(), icon: Calendar, color: '#F97316', href: '/admin/activities', change: 'From today' },
    { label: 'Club Balance', value: `RM ${stats.balance.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`, icon: DollarSign, color: '#10B981', href: '/admin/finance', change: 'Total balance' },
    { label: 'Pinned Notices', value: stats.announcements.toString(), icon: Bell, color: '#8B5CF6', href: '/admin/announcements', change: 'Active pins' },
  ]

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  if (loading) return (
    <div className="p-8 flex items-center justify-center min-h-[400px]">
      <p className="text-uco-text-muted text-sm">Loading dashboard...</p>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-uco-text">
          Good morning{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''} 👋
        </h1>
        <p className="text-uco-text-muted text-sm mt-1">
          Here is what is happening with your club today.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <Link key={card.label} href={card.href}
              className="bg-white rounded-2xl p-5 border border-uco-border hover:shadow-md hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${card.color}12` }}>
                  <Icon size={18} style={{ color: card.color }} />
                </div>
                <ArrowUpRight size={14} className="text-uco-text-muted group-hover:text-uco-blue transition-colors mt-1" />
              </div>
              <div className="text-2xl font-black text-uco-text mb-0.5">{card.value}</div>
              <div className="text-xs text-uco-text-muted font-medium">{card.label}</div>
              <div className="text-xs text-uco-text-muted mt-0.5 opacity-60">{card.change}</div>
            </Link>
          )
        })}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Activities */}
        <div className="bg-white rounded-2xl border border-uco-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} style={{ color: '#F97316' }} />
              <h2 className="font-bold text-uco-text text-sm">Upcoming Activities</h2>
            </div>
            <Link href="/admin/activities" className="text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>
              View all
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="text-center py-8">
              <Calendar size={28} className="mx-auto mb-2 text-uco-border" />
              <p className="text-sm text-uco-text-muted">No upcoming activities</p>
              <Link href="/admin/activities" className="text-xs font-semibold mt-2 inline-block" style={{ color: '#1E3A8A' }}>
                + Add Activity
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {upcoming.map(act => (
                <div key={act.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-uco-surface transition-colors">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(249,115,22,0.1)' }}>
                    <Clock size={16} style={{ color: '#F97316' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-uco-text truncate">{act.title}</p>
                    <p className="text-xs text-uco-text-muted">{formatDate(act.activity_date)}{act.location ? ` • ${act.location}` : ''}</p>
                  </div>
                  <span className="badge-orange text-xs flex-shrink-0">{act.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-2xl border border-uco-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={16} style={{ color: '#1E3A8A' }} />
              <h2 className="font-bold text-uco-text text-sm">Recent Members</h2>
            </div>
            <Link href="/admin/members" className="text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>
              View all
            </Link>
          </div>
          {recentMembers.length === 0 ? (
            <div className="text-center py-8">
              <Users size={28} className="mx-auto mb-2 text-uco-border" />
              <p className="text-sm text-uco-text-muted">No members yet</p>
              <Link href="/admin/members" className="text-xs font-semibold mt-2 inline-block" style={{ color: '#1E3A8A' }}>
                + Add Member
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recentMembers.map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-uco-surface transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0"
                    style={{ background: '#1E3A8A' }}>{m.full_name[0]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-uco-text truncate">{m.full_name}</p>
                    <p className="text-xs text-uco-text-muted">Joined {formatDate(m.joined_at)}</p>
                  </div>
                  <span className="badge-blue text-xs flex-shrink-0">{m.role}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Pending Approvals widget */}
      {pendingApprovals.length > 0 && (
        <div className="mt-6 rounded-2xl border p-5"
          style={{ background: 'rgba(249,115,22,0.06)', borderColor: 'rgba(249,115,22,0.25)' }}>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} style={{ color: '#F97316' }} />
            <h2 className="font-bold text-sm" style={{ color: '#C2410C' }}>⚠️ Action Required — Pending Approvals</h2>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#F97316' }}>
              {pendingApprovals.reduce((s, p) => s + p.count, 0)}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {pendingApprovals.map(p => {
              const moduleHref: Record<string, string> = {
                finance: '/admin/finance',
                activities: '/admin/activities',
                members: '/admin/members',
                announcements: '/admin/announcements',
                history: '/admin/history',
              }
              const moduleIcon: Record<string, React.ReactNode> = {
                finance: <DollarSign size={15} style={{ color: '#F97316' }} />,
                activities: <Calendar size={15} style={{ color: '#F97316' }} />,
                members: <Users size={15} style={{ color: '#F97316' }} />,
                announcements: <Bell size={15} style={{ color: '#F97316' }} />,
              }
              return (
                <Link key={p.module} href={moduleHref[p.module] || '#'}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white border hover:shadow-sm transition-all"
                  style={{ borderColor: 'rgba(249,115,22,0.2)' }}>
                  {moduleIcon[p.module] || <Clock size={15} style={{ color: '#F97316' }} />}
                  <div>
                    <p className="text-sm font-bold capitalize" style={{ color: '#C2410C' }}>{p.module}</p>
                    <p className="text-xs text-uco-text-muted">{p.count} pending</p>
                  </div>
                  <ArrowUpRight size={12} className="ml-auto text-uco-text-muted" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* All approved notice — no pending */}
      {pendingApprovals.length === 0 && (
        <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <CheckCircle size={15} style={{ color: '#10B981' }} />
          <p className="text-sm font-medium" style={{ color: '#059669' }}>All caught up — no pending approvals</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-6 bg-white rounded-2xl border border-uco-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={16} style={{ color: '#1E3A8A' }} />
          <h2 className="font-bold text-uco-text text-sm">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Add Member', href: '/admin/members', color: '#1E3A8A', icon: Users },
            { label: 'New Activity', href: '/admin/activities', color: '#F97316', icon: Calendar },
            { label: 'Log Finance', href: '/admin/finance', color: '#10B981', icon: DollarSign },
            { label: 'Announce', href: '/admin/announcements', color: '#8B5CF6', icon: Bell },
          ].map(action => {
            const Icon = action.icon
            return (
              <Link key={action.label} href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-uco-border hover:shadow-sm hover:-translate-y-0.5 transition-all text-center">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: `${action.color}12` }}>
                  <Icon size={16} style={{ color: action.color }} />
                </div>
                <span className="text-xs font-semibold text-uco-text">{action.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
