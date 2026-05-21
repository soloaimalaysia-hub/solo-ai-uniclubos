'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import {
  Plus, X, Save, DollarSign, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Clock, CheckCircle, XCircle, AlertTriangle
} from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  transaction_date: string
  reference_no: string | null
  approved_by: string | null
  submitted_by: string | null
  approver_id: string | null
  approval_status: string   // 'approved' | 'pending_approval' | 'rejected'
  rejection_note: string | null
}

interface RolePermission {
  can_approve: boolean
  requires_approval: boolean
}

const INCOME_CATEGORIES = ['Membership Fee', 'Event Ticket', 'Sponsorship', 'Donation', 'Grant', 'Other Income']
const EXPENSE_CATEGORIES = ['Equipment', 'Venue', 'Food & Beverage', 'Transport', 'Printing', 'Marketing', 'Award', 'Other Expense']

// Roles that bypass role_permissions lookup and always auto-approve
const AUTO_APPROVE_ROLES = ['President', 'Captain', 'Vice Captain', 'Treasurer']

export default function FinancePage() {
  const { user } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Partial<Transaction> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [typeTab, setTypeTab] = useState<'all' | 'income' | 'expense' | 'pending'>('all')
  const [rolePerm, setRolePerm] = useState<RolePermission>({ can_approve: true, requires_approval: false })
  const [rejectModal, setRejectModal] = useState<{ id: string; approvalId: string | null } | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejecting, setRejecting] = useState(false)

  const loadTransactions = useCallback(async () => {
    const supabase = createClient()
    let q = supabase.from('uco_finance').select('*').order('transaction_date', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setTransactions(data || [])
    setLoading(false)
  }, [user?.club_id])

  // Load role permissions for current user's club role
  const loadRolePerm = useCallback(async () => {
    const clubRole = user?.club_role || user?.platform_role || 'Member'

    // Fast path: well-known approver roles
    if (AUTO_APPROVE_ROLES.includes(clubRole)) {
      setRolePerm({ can_approve: true, requires_approval: false })
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('uco_role_permissions')
      .select('can_approve, requires_approval')
      .eq('role', clubRole)
      .eq('module', 'finance')
      .is('club_id', null)
      .single()

    if (data) {
      setRolePerm({ can_approve: data.can_approve, requires_approval: data.requires_approval })
    } else {
      // Default: non-approver, requires approval
      setRolePerm({ can_approve: false, requires_approval: true })
    }
  }, [user?.club_role, user?.platform_role])

  useEffect(() => {
    loadTransactions()
    loadRolePerm()
  }, [loadTransactions, loadRolePerm])

  function openAdd(type: 'income' | 'expense' = 'income') {
    setEditingTx({
      type,
      transaction_date: new Date().toISOString().split('T')[0],
      category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
    })
    setShowModal(true)
  }

  async function saveTx() {
    if (!editingTx?.amount || !editingTx?.category) return
    setSaving(true)
    const supabase = createClient()

    // Determine approval status based on role
    const willAutoApprove = rolePerm.can_approve && !rolePerm.requires_approval
    const approvalStatus = willAutoApprove ? 'approved' : 'pending_approval'

    const payload = {
      type: editingTx.type || 'income',
      amount: Number(editingTx.amount),
      category: editingTx.category,
      description: editingTx.description || null,
      transaction_date: editingTx.transaction_date || new Date().toISOString().split('T')[0],
      reference_no: editingTx.reference_no || null,
      approved_by: editingTx.approved_by || null,
      club_id: user?.club_id,
      submitted_by: user?.id || null,
      approval_status: approvalStatus,
      approver_id: willAutoApprove ? (user?.id || null) : null,
    }

    let recordId: string | null = null

    if (editingTx.id) {
      // Edit: keep existing approval_status unless user is approver
      const updatePayload = {
        ...payload,
        approval_status: editingTx.approval_status || approvalStatus,
        updated_at: new Date().toISOString()
      }
      await supabase.from('uco_finance').update(updatePayload).eq('id', editingTx.id)
      recordId = editingTx.id
    } else {
      const { data } = await supabase.from('uco_finance').insert(payload).select('id').single()
      recordId = data?.id || null

      // If pending, create approval request
      if (approvalStatus === 'pending_approval' && recordId) {
        await supabase.from('uco_approvals').insert({
          club_id: user?.club_id,
          module: 'finance',
          action: 'create',
          record_id: recordId,
          record_table: 'uco_finance',
          submitted_by: user?.id,
          submission_data: payload,
          status: 'pending',
        })
      }
    }

    // Write audit log
    if (recordId) {
      await supabase.from('uco_audit_log').insert({
        club_id: user?.club_id,
        user_id: user?.id,
        user_name: user?.full_name,
        user_role: user?.club_role || user?.platform_role,
        module: 'finance',
        action: editingTx.id ? 'edit' : (approvalStatus === 'pending_approval' ? 'submit_for_approval' : 'create'),
        record_id: recordId,
        record_table: 'uco_finance',
        new_data: payload,
      })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadTransactions() }, 1200)
  }

  // Approve a pending transaction
  async function approveTx(tx: Transaction) {
    const supabase = createClient()
    await supabase.from('uco_finance')
      .update({ approval_status: 'approved', approver_id: user?.id, updated_at: new Date().toISOString() })
      .eq('id', tx.id)

    // Update approval record
    await supabase.from('uco_approvals')
      .update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      .eq('record_id', tx.id).eq('status', 'pending')

    // Audit log
    await supabase.from('uco_audit_log').insert({
      club_id: user?.club_id,
      user_id: user?.id,
      user_name: user?.full_name,
      user_role: user?.club_role || user?.platform_role,
      module: 'finance',
      action: 'approve',
      record_id: tx.id,
      record_table: 'uco_finance',
      old_data: { approval_status: 'pending_approval' },
      new_data: { approval_status: 'approved' },
    })

    loadTransactions()
  }

  // Open reject modal
  function openReject(tx: Transaction) {
    setRejectModal({ id: tx.id, approvalId: null })
    setRejectNote('')
  }

  // Confirm rejection
  async function confirmReject() {
    if (!rejectModal) return
    setRejecting(true)
    const supabase = createClient()
    await supabase.from('uco_finance')
      .update({
        approval_status: 'rejected',
        approver_id: user?.id,
        rejection_note: rejectNote || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', rejectModal.id)

    await supabase.from('uco_approvals')
      .update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
        review_note: rejectNote || null,
      })
      .eq('record_id', rejectModal.id).eq('status', 'pending')

    await supabase.from('uco_audit_log').insert({
      club_id: user?.club_id,
      user_id: user?.id,
      user_name: user?.full_name,
      user_role: user?.club_role || user?.platform_role,
      module: 'finance',
      action: 'reject',
      record_id: rejectModal.id,
      record_table: 'uco_finance',
      new_data: { approval_status: 'rejected', rejection_note: rejectNote },
    })

    setRejecting(false)
    setRejectModal(null)
    loadTransactions()
  }

  // Approved-only amounts for summary
  const approvedTx = transactions.filter(t => t.approval_status === 'approved')
  const totalIncome = approvedTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = approvedTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense
  const pendingCount = transactions.filter(t => t.approval_status === 'pending_approval').length

  const filtered = transactions.filter(t => {
    if (typeTab === 'pending') return t.approval_status === 'pending_approval'
    if (typeTab === 'all') return true
    return t.type === typeTab
  })

  function formatRM(n: number) { return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` }
  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) }

  function statusBadge(status: string) {
    if (status === 'approved') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700">
        <CheckCircle size={10} /> Approved
      </span>
    )
    if (status === 'pending_approval') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
        <Clock size={10} /> Pending
      </span>
    )
    if (status === 'rejected') return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
        <XCircle size={10} /> Rejected
      </span>
    )
    return null
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <DollarSign size={22} style={{ color: '#10B981' }} /> Finance
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">
            {transactions.length} transactions
            {pendingCount > 0 && (
              <span className="ml-1 text-orange-500 font-semibold">· {pendingCount} pending approval</span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => openAdd('expense')} className="btn-outline text-sm px-4 py-2">
            <ArrowDownRight size={14} /> Expense
          </button>
          <button onClick={() => openAdd('income')} className="btn-primary text-sm">
            <ArrowUpRight size={14} /> Income
          </button>
        </div>
      </div>

      {/* Pending approval banner */}
      {pendingCount > 0 && rolePerm.can_approve && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold"
          style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)', color: '#C2410C' }}>
          <AlertTriangle size={16} />
          <span>
            {pendingCount} transaction{pendingCount > 1 ? 's' : ''} waiting for your approval!
            Click <strong>✓ Approve</strong> to process.
          </span>
          <button onClick={() => setTypeTab('pending')}
            className="ml-auto text-xs font-bold underline">View pending</button>
        </div>
      )}

      {/* Role notice for non-approvers */}
      {rolePerm.requires_approval && !rolePerm.can_approve && (
        <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'rgba(30,58,138,0.06)', border: '1px solid rgba(30,58,138,0.12)', color: '#1E3A8A' }}>
          <Clock size={15} />
          <span>Your submissions require approval from a Treasurer, Captain, or President before they are counted in the balance.</span>
        </div>
      )}

      {/* Summary cards — approved only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatRM(totalIncome), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.1)', sub: 'Approved only' },
          { label: 'Total Expense', value: formatRM(totalExpense), icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', sub: 'Approved only' },
          { label: 'Balance', value: formatRM(balance), icon: DollarSign,
            color: balance >= 0 ? '#1E3A8A' : '#EF4444',
            bg: balance >= 0 ? 'rgba(30,58,138,0.08)' : 'rgba(239,68,68,0.08)',
            sub: pendingCount > 0 ? `+${pendingCount} pending` : 'All approved' },
        ].map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="bg-white rounded-2xl border border-uco-border p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                  <Icon size={17} style={{ color: card.color }} />
                </div>
                <span className="text-xs font-bold text-uco-text-muted uppercase tracking-wide">{card.label}</span>
              </div>
              <div className="text-2xl font-black" style={{ color: card.color }}>{card.value}</div>
              <div className="text-xs text-uco-text-muted mt-1">{card.sub}</div>
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-uco-surface rounded-xl mb-5 w-fit">
        {([
          { key: 'all', label: 'All' },
          { key: 'income', label: 'Income' },
          { key: 'expense', label: 'Expense' },
          { key: 'pending', label: `Pending${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
        ] as const).map(t => (
          <button key={t.key} onClick={() => setTypeTab(t.key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${typeTab === t.key
              ? t.key === 'pending' ? 'bg-orange-500 shadow-sm text-white' : 'bg-white shadow-sm text-uco-text'
              : 'text-uco-text-muted hover:text-uco-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm mb-4">
            {typeTab === 'pending' ? 'No pending transactions' : 'No transactions yet'}
          </p>
          {typeTab !== 'pending' && (
            <button onClick={() => openAdd()} className="btn-primary text-sm inline-flex">
              <Plus size={15} /> Add First Transaction
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-uco-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-uco-border bg-uco-surface">
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-uco-border">
              {filtered.map(t => (
                <tr key={t.id}
                  className={`transition-colors ${t.approval_status === 'pending_approval' ? 'bg-orange-50/60' : t.approval_status === 'rejected' ? 'bg-red-50/40' : 'hover:bg-uco-surface'}`}>
                  <td className="px-5 py-3.5 text-xs text-uco-text-muted whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {t.type === 'income'
                        ? <ArrowUpRight size={14} style={{ color: '#10B981' }} />
                        : <ArrowDownRight size={14} style={{ color: '#EF4444' }} />}
                      <span className="text-sm font-medium text-uco-text">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-uco-text-muted hidden md:table-cell">
                    <div>{t.description || '—'}</div>
                    {t.rejection_note && (
                      <div className="text-xs text-red-500 mt-0.5">✕ {t.rejection_note}</div>
                    )}
                  </td>
                  <td className="px-5 py-3.5">{statusBadge(t.approval_status)}</td>
                  <td className="px-5 py-3.5 text-right font-bold" style={{ color: t.type === 'income' ? '#10B981' : '#EF4444' }}>
                    {t.type === 'income' ? '+' : '-'}{formatRM(Number(t.amount))}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5 justify-end">
                      {/* Approve / Reject — only for approvers, only on pending */}
                      {t.approval_status === 'pending_approval' && rolePerm.can_approve && (
                        <>
                          <button onClick={() => approveTx(t)}
                            className="text-xs font-bold px-2.5 py-1 rounded-lg text-white transition-all hover:opacity-90"
                            style={{ background: '#10B981' }}>
                            ✓
                          </button>
                          <button onClick={() => openReject(t)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg text-red-500 bg-red-50 hover:bg-red-100 transition-all">
                            ✕
                          </button>
                        </>
                      )}
                      <button onClick={() => { setEditingTx({ ...t }); setShowModal(true) }}
                        className="text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">{editingTx.id ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
              {/* Approval notice */}
              {!editingTx.id && rolePerm.requires_approval && (
                <div className="flex items-center gap-2 p-3 rounded-xl text-xs font-medium"
                  style={{ background: 'rgba(249,115,22,0.08)', color: '#C2410C' }}>
                  <Clock size={13} />
                  This transaction will be sent for approval before being counted in the balance.
                </div>
              )}
              {/* Type toggle */}
              <div className="flex gap-2">
                {(['income', 'expense'] as const).map(t => (
                  <button key={t} onClick={() => setEditingTx(prev => ({
                    ...prev, type: t,
                    category: t === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0]
                  }))}
                    className={`flex-1 py-2 rounded-xl text-sm font-bold capitalize border-2 transition-all ${editingTx.type === t
                      ? t === 'income' ? 'border-uco-success bg-green-50 text-uco-success' : 'border-uco-danger bg-red-50 text-uco-danger'
                      : 'border-uco-border text-uco-text-muted'}`}>
                    {t === 'income' ? '+ Income' : '- Expense'}
                  </button>
                ))}
              </div>
              <div>
                <label className="label">Amount (RM) *</label>
                <input className="input" type="number" step="0.01" min="0" placeholder="0.00"
                  value={editingTx.amount || ''}
                  onChange={e => setEditingTx(prev => ({ ...prev, amount: Number(e.target.value) }))} />
              </div>
              <div>
                <label className="label">Category *</label>
                <select className="input" value={editingTx.category || ''}
                  onChange={e => setEditingTx(prev => ({ ...prev, category: e.target.value }))}>
                  {(editingTx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" placeholder="Brief description..."
                  value={editingTx.description || ''}
                  onChange={e => setEditingTx(prev => ({ ...prev, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date"
                    value={editingTx.transaction_date || ''}
                    onChange={e => setEditingTx(prev => ({ ...prev, transaction_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Reference No.</label>
                  <input className="input" placeholder="REF-001"
                    value={editingTx.reference_no || ''}
                    onChange={e => setEditingTx(prev => ({ ...prev, reference_no: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Approved By (name)</label>
                <input className="input" placeholder="Treasurer name"
                  value={editingTx.approved_by || ''}
                  onChange={e => setEditingTx(prev => ({ ...prev, approved_by: e.target.value }))} />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-uco-border flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline text-sm px-4 py-2">Cancel</button>
              <button onClick={saveTx} disabled={saving}
                className="btn-primary text-sm px-5 py-2 disabled:opacity-60">
                <Save size={14} />
                {saving ? 'Saving...' : saved ? '✓ Saved!' : rolePerm.requires_approval && !editingTx.id ? 'Submit for Approval' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject reason modal */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">Reject Transaction</h2>
              <button onClick={() => setRejectModal(null)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6">
              <label className="label">Reason for rejection</label>
              <textarea className="input min-h-[80px] resize-none" placeholder="Please explain why this is rejected..."
                value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            </div>
            <div className="px-6 py-4 border-t border-uco-border flex justify-end gap-3">
              <button onClick={() => setRejectModal(null)} className="btn-outline text-sm px-4 py-2">Cancel</button>
              <button onClick={confirmReject} disabled={rejecting}
                className="text-sm px-5 py-2 rounded-xl font-bold text-white disabled:opacity-60 transition-all"
                style={{ background: '#EF4444' }}>
                {rejecting ? 'Rejecting...' : '✕ Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
