'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react'

const CATEGORIES = ['Sports', 'Cultural', 'Academic', 'Religious', 'Interest', 'Others']

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAppStore()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    clubName: '',
    universityName: '',
    category: 'Sports',
  })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'form' | 'confirm'>('form')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (!form.clubName.trim() || !form.universityName.trim()) {
      setError('Please fill in your club and university name.')
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      // 1. Create Supabase auth user
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.name },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const userId = authData.user?.id
      if (!userId) {
        setError('Account creation failed. Please try again.')
        setLoading(false)
        return
      }

      // 2. Create or find university
      let universityId: string | null = null
      const { data: existingUni } = await supabase
        .from('uco_universities')
        .select('id')
        .ilike('name', form.universityName.trim())
        .limit(1)
        .maybeSingle()

      if (existingUni) {
        universityId = existingUni.id
      } else {
        const { data: newUni } = await supabase
          .from('uco_universities')
          .insert({ name: form.universityName.trim(), country: 'Malaysia' })
          .select('id')
          .single()
        universityId = newUni?.id ?? null
      }

      // 3. Create club
      const { data: clubData, error: clubError } = await supabase
        .from('uco_clubs')
        .insert({
          name: form.clubName.trim(),
          category: form.category,
          university_id: universityId,
          university_name: form.universityName.trim(),
          status: 'active',
        })
        .select('id')
        .single()

      if (clubError || !clubData) {
        setError('Failed to create club. Please try again.')
        setLoading(false)
        return
      }

      const clubId = clubData.id

      // 4. Create user profile
      await supabase.from('uco_users').upsert({
        id: userId,
        email: form.email,
        full_name: form.name,
        name: form.name,
        platform_role: 'captain',
        club_id: clubId,
      })

      // 5. Check if session is active (email confirmation disabled)
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        // Email confirmation disabled — log in immediately
        const profile = {
          id: userId,
          email: form.email,
          full_name: form.name,
          platform_role: 'captain',
          club_id: clubId,
        }
        setUser(profile)
        router.push('/admin/dashboard')
      } else {
        // Email confirmation required — show confirmation screen
        setStep('confirm')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'confirm') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4"
        style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)' }}>
        <div className="w-full max-w-sm text-center">
          <CheckCircle size={52} className="mx-auto mb-4" style={{ color: '#10B981' }} />
          <h1 className="text-2xl font-black text-uco-text mb-2">Check your email!</h1>
          <p className="text-uco-text-muted text-sm mb-6">
            We sent a confirmation link to <strong>{form.email}</strong>. Click it to activate your account, then log in.
          </p>
          <Link href="/admin-login" className="btn-primary inline-flex">
            Go to Login <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-7">
          <Link href="/" className="inline-flex items-center gap-2.5 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>U</div>
            <span className="font-black text-xl text-uco-text">UniClub <span style={{ color: '#1E3A8A' }}>OS</span></span>
          </Link>
          <p className="text-uco-text-muted text-sm mt-2">Create your club account — free forever</p>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-lg border border-uco-border">
          <h2 className="text-lg font-black text-uco-text mb-5">Set up your club</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Personal info */}
            <div>
              <label className="label">Your Name</label>
              <input className="input" placeholder="Ahmad bin Abu Bakar" required
                value={form.name} onChange={e => update('name', e.target.value)} />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="you@university.edu.my" required
                value={form.email} onChange={e => update('email', e.target.value)} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-10" type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters" required
                  value={form.password} onChange={e => update('password', e.target.value)} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-uco-text-muted hover:text-uco-text">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div>
              <label className="label">Confirm Password</label>
              <input className="input" type="password" placeholder="Same as above" required
                value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
            </div>

            {/* Divider */}
            <div className="pt-1 pb-1">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-uco-border" />
                <span className="text-xs text-uco-text-muted font-medium">Club Details</span>
                <div className="flex-1 h-px bg-uco-border" />
              </div>
            </div>

            {/* Club info */}
            <div>
              <label className="label">Club Name</label>
              <input className="input" placeholder="USJ Basketball Club" required
                value={form.clubName} onChange={e => update('clubName', e.target.value)} />
            </div>
            <div>
              <label className="label">University Name</label>
              <input className="input" placeholder="Universiti Malaya" required
                value={form.universityName} onChange={e => update('universityName', e.target.value)} />
            </div>
            <div>
              <label className="label">Club Category</label>
              <select className="input" value={form.category} onChange={e => update('category', e.target.value)}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm mt-2 disabled:opacity-60 gap-2">
              {loading ? 'Creating your club...' : <>Create My Club <ArrowRight size={16} /></>}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-uco-text-muted mt-4">
          Already have an account?{' '}
          <Link href="/admin-login" className="font-semibold hover:text-uco-blue transition-colors" style={{ color: '#1E3A8A' }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}
