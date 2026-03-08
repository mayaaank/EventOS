// Path: app/(dashboard)/layout.tsx
'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@/lib/supabase/client'
import { authService } from '@/services/auth.service'
import { User } from '@/types'
import Sidebar from '@/components/shared/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createBrowserClient()
    let mounted = true

    // ── onAuthStateChange is the single source of truth ──────────────────────
    // Fires immediately with INITIAL_SESSION — no separate getSession() needed.
    // Eliminates the race condition where getSession() resolved before the
    // session cookie from login/register was fully written to the browser.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'INITIAL_SESSION') {
          if (!session) {
            router.replace('/login')
            return
          }
          const profile = await authService.getCurrentUser()
          if (!profile) { router.replace('/login'); return }
          setUser(profile)
          setLoading(false)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          const profile = await authService.getCurrentUser()
          if (profile) { setUser(profile); setLoading(false) }
          return
        }

        if (event === 'SIGNED_OUT') {
          setUser(null)
          router.replace('/login')
        }
      }
    )

    return () => { mounted = false; subscription.unsubscribe() }
  }, [router])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-6 h-6 rounded-full border-2 animate-spin"
        style={{ borderColor: 'var(--brand-soft)', borderTopColor: 'var(--brand)' }} />
    </div>
  )

  if (!user) return null

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--ink-6)' }}>
      <Sidebar user={user} />
      <main className="flex-1 overflow-auto min-w-0">{children}</main>
    </div>
  )
}