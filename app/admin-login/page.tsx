'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/useAppStore'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setUser } = useAppStore()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError || !data.user) {
        setError('Invalid email or password. Please try again.')
        setLoading(false)
        return
      }
      // Fetch profile from uco_users
      const { data: profile } = await supabase
        .from('uco_users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profile) {
        setUser(profile)
        if (['super_admin', 'platform_admin', 'club_admin', 'captain'].includes(profile.platform_role ?? '')) {
          router.push('/admin/dashboard')
        } else {
          setError('You do not have admin access.')
          await supabase.auth.signOut()
          setUser(null)
        }
      } else {
        // First time — create profile
        const newProfile = {
          id: data.user.id,
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Admin',
          platform_role: 'super_admin',
        }
        await supabase.from('uco_users').insert(newProfile)
        setUser(newProfile)
        router.push('/admin/dashboard')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'linear-gradient(135deg, #EFF6FF 0%, #F8FAFC 100%)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-2xl mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)' }}>U</div>
          <h1 className="text-2xl font-black text-uco-text">UniClub OS</h1>
          <p className="text-sm text-uco-text-muted mt-1">Admin Dashboard</p>
        </div>

        <div className="bg-white rounded-2xl p-7 shadow-lg border border-uco-border">
          <h2 className="text-lg font-bold text-uco-text mb-5">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-700 bg-red-50 border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input"
                placeholder="captaink@uniclubos.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-uco-text-muted hover:text-uco-text transition-colors">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center py-3 text-sm disabled:opacity-60">
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-uco-text-muted mt-6">
          <Link href="/" className="hover:text-uco-blue transition-colors">Back to homepage</Link>
        </p>
      </div>
    </div>
  )
}
