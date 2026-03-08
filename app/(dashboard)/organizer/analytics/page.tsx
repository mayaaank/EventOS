// Path: app/(dashboard)/organizer/analytics/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { BarChart3, Users, CheckCircle, Loader2 } from 'lucide-react'
import { eventsService } from '@/services/events.service'
import { authService } from '@/services/auth.service'
import { Event, EventAnalytics, User } from '@/types'
import { formatDate } from '@/lib/utils'

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--ink-5)' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="mono text-sm font-semibold w-8 text-right" style={{ color }}>{score}</span>
    </div>
  )
}

export default function OrganizerAnalyticsPage() {
  const [, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [analytics, setAnalytics] = useState<Record<string, EventAnalytics>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const u = await authService.getCurrentUser()
      setUser(u)
      if (!u) return
      const res = await eventsService.getAll({ created_by: u.id })
      const evs: Event[] = res.data ?? []
      setEvents(evs)
      const map: Record<string, EventAnalytics> = {}
      await Promise.all(evs.map(async e => {
        const a = await eventsService.getAnalytics(e.id)
        if (a.data) map[e.id] = a.data
      }))
      setAnalytics(map)
      setLoading(false)
    }
    load()
  }, [])

  const totalRegs = Object.values(analytics).reduce((s, a) => s + a.total_registrations, 0)
  const totalCheckin = Object.values(analytics).reduce((s, a) => s + a.checked_in_count, 0)
  const avgHealth = Object.values(analytics).length
    ? Math.round(Object.values(analytics).reduce((s, a) => s + a.health_score, 0) / Object.values(analytics).length)
    : 0

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-8 fade-in">
        <p className="label-xs mb-1">Organizer</p>
        <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>Performance across all your events</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: BarChart3, label: 'Avg Health Score', value: `${avgHealth}%` },
          { icon: Users, label: 'Total Registrations', value: totalRegs },
          { icon: CheckCircle, label: 'Total Checked In', value: totalCheckin },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="card bg-white p-5 slide-up">
            <div className="flex items-center justify-between mb-4">
              <p className="label-xs">{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--accent-light)' }}>
                <Icon className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              </div>
            </div>
            <div className="stat-num">{value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} /></div>
      ) : (
        <div className="card bg-white overflow-hidden slide-up stagger-2">
          <div className="px-6 py-4 border-b" style={{ borderColor: 'var(--border)', background: 'var(--ink-6)' }}>
            <span className="text-sm font-semibold">Per-Event Breakdown</span>
          </div>
          {events.length === 0 ? (
            <div className="py-16 text-center"><p className="text-sm" style={{ color: 'var(--ink-3)' }}>No events yet</p></div>
          ) : events.map((event, i) => {
            const a = analytics[event.id]
            if (!a) return null
            return (
              <div key={event.id} className="px-6 py-4 border-b last:border-0 slide-up"
                style={{ borderColor: 'var(--border)', animationDelay: `${i * 0.06}s` }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--ink-6)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-sm">{event.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--ink-3)' }}>{formatDate(event.start_date)} · {event.location}</p>
                  </div>
                  <div className="w-32"><HealthBar score={a.health_score} /></div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Registrations', value: a.total_registrations },
                    { label: 'Checked In', value: `${a.checked_in_count} (${a.checkin_rate}%)` },
                    { label: 'Teams', value: a.total_teams },
                    { label: 'Team Fill', value: `${a.team_formation_rate}%` },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="label-xs mb-1">{label}</p>
                      <p className="mono text-sm font-semibold" style={{ color: 'var(--ink)' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}