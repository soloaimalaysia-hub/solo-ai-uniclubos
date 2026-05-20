'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Plus, X, Save, DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category: string
  description: string | null
  transaction_date: string
  reference_no: string | null
  approved_by: string | null
}

const INCOME_CATEGORIES = ['Membership Fee', 'Event Ticket', 'Sponsorship', 'Donation', 'Grant', 'Other Income']
const EXPENSE_CATEGORIES = ['Equipment', 'Venue', 'Food & Beverage', 'Transport', 'Printing', 'Marketing', 'Award', 'Other Expense']

export default function FinancePage() {
  const { user } = useAppStore()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTx, setEditingTx] = useState<Partial<Transaction> | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [typeTab, setTypeTab] = useState<'all' | 'income' | 'expense'>('all')

  useEffect(() => { loadTransactions() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  async function loadTransactions() {
    const supabase = createClient()
    let q = supabase.from('uco_finance').select('*').order('transaction_date', { ascending: false })
    if (user?.club_id) q = q.eq('club_id', user.club_id)
    const { data } = await q
    setTransactions(data || [])
    setLoading(false)
  }

  function openAdd(type: 'income' | 'expense' = 'income') {
    setEditingTx({ type, transaction_date: new Date().toISOString().split('T')[0], category: type === 'income' ? INCOME_CATEGORIES[0] : EXPENSE_CATEGORIES[0] })
    setShowModal(true)
  }

  async function saveTx() {
    if (!editingTx?.amount || !editingTx?.category) return
    setSaving(true)
    const supabase = createClient()
    const payload = {
      type: editingTx.type || 'income',
      amount: Number(editingTx.amount),
      category: editingTx.category,
      description: editingTx.description || null,
      transaction_date: editingTx.transaction_date || new Date().toISOString().split('T')[0],
      reference_no: editingTx.reference_no || null,
      approved_by: editingTx.approved_by || null,
      club_id: user?.club_id,
    }
    if (editingTx.id) {
      await supabase.from('uco_finance').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editingTx.id)
    } else {
      await supabase.from('uco_finance').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setShowModal(false); loadTransactions() }, 1200)
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
  const balance = totalIncome - totalExpense

  const filtered = transactions.filter(t => typeTab === 'all' ? true : t.type === typeTab)

  function formatRM(n: number) { return `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` }
  function formatDate(d: string) { return new Date(d).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' }) }

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-uco-text flex items-center gap-2">
            <DollarSign size={22} style={{ color: '#10B981' }} /> Finance
          </h1>
          <p className="text-uco-text-muted text-sm mt-0.5">{transactions.length} transactions</p>
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

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Income', value: formatRM(totalIncome), icon: TrendingUp, color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'Total Expense', value: formatRM(totalExpense), icon: TrendingDown, color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Balance', value: formatRM(balance), icon: DollarSign, color: balance >= 0 ? '#1E3A8A' : '#EF4444', bg: balance >= 0 ? 'rgba(30,58,138,0.08)' : 'rgba(239,68,68,0.08)' },
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
            </div>
          )
        })}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-uco-surface rounded-xl mb-5 w-fit">
        {(['all', 'income', 'expense'] as const).map(t => (
          <button key={t} onClick={() => setTypeTab(t)}
            className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${typeTab === t ? 'bg-white shadow-sm text-uco-text' : 'text-uco-text-muted hover:text-uco-text'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-uco-text-muted text-sm">Loading transactions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <DollarSign size={36} className="mx-auto mb-3 text-uco-border" />
          <p className="text-uco-text-muted text-sm mb-4">No transactions yet</p>
          <button onClick={() => openAdd()} className="btn-primary text-sm inline-flex">
            <Plus size={15} /> Add First Transaction
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-uco-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-uco-border bg-uco-surface">
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Category</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide hidden md:table-cell">Description</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-uco-text-muted uppercase tracking-wide">Amount</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-uco-border">
              {filtered.map(t => (
                <tr key={t.id} className="hover:bg-uco-surface transition-colors">
                  <td className="px-5 py-3.5 text-xs text-uco-text-muted whitespace-nowrap">{formatDate(t.transaction_date)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {t.type === 'income'
                        ? <ArrowUpRight size={14} style={{ color: '#10B981' }} />
                        : <ArrowDownRight size={14} style={{ color: '#EF4444' }} />}
                      <span className="text-sm font-medium text-uco-text">{t.category}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-uco-text-muted hidden md:table-cell">{t.description || '—'}</td>
                  <td className="px-5 py-3.5 text-right font-bold" style={{ color: t.type === 'income' ? '#10B981' : '#EF4444' }}>
                    {t.type === 'income' ? '+' : '-'}{formatRM(Number(t.amount))}
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => { setEditingTx({ ...t }); setShowModal(true) }}
                      className="text-xs font-semibold hover:underline" style={{ color: '#1E3A8A' }}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-uco-border flex items-center justify-between">
              <h2 className="font-bold text-uco-text">{editingTx.id ? 'Edit Transaction' : 'Add Transaction'}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-uco-surface text-uco-text-muted"><X size={18} /></button>
            </div>
            <div className="p-6 space-y-4">
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
                <label className="label">Approved By</label>
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
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
