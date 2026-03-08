// Path: app/(dashboard)/organizer/discover/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { Calendar, MapPin, Users, Search } from 'lucide-react'
import { eventsService } from '@/services/events.service'
import { authService } from '@/services/auth.service'
import { Event, User } from '@/types'
import { formatDate } from '@/lib/utils'

const STATUS_BADGE: Record<string, string> = {
  PUBLISHED: 'badge-blue', ONGOING: 'badge-green', COMPLETED: 'badge-indigo',
  DRAFT: 'badge-neutral', CANCELLED: 'badge-red',
}

export default function OrganizerDiscoverPage() {
  const [, setUser] = useState<User | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function init() {
      const u = await authService.getCurrentUser()
      setUser(u)
      if (!u) return
      eventsService.getAll().then(res => {
        // Show events NOT created by this organizer
        setEvents((res.data ?? []).filter((e: Event) =>
          ['PUBLISHED', 'ONGOING'].includes(e.status) && e.created_by !== u.id
        ))
        setLoading(false)
      })
    }
    init()
  }, [])

  const filtered = events.filter(e =>
    !search ||
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.location.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-start justify-between mb-8 fade-in">
        <div>
          <p className="label-xs mb-1">Organizer</p>
          <h1 className="text-2xl font-bold tracking-tight" style={{ letterSpacing: '-0.02em' }}>Discover Events</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-3)' }}>Other organizers&apos; live events</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: 'var(--ink-4)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search events…" className="input pl-8 py-2 text-sm w-48" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--ink-4)', borderTopColor: 'var(--accent)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-white py-16 text-center">
          <Calendar className="w-8 h-8 mx-auto mb-3" style={{ color: 'var(--ink-5)' }} />
          <p className="text-sm font-medium">No other events found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((event, i) => (
            <div key={event.id} className="card card-hover bg-white p-5 slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold"
                  style={{ background: 'var(--ink-3)' }}>
                  {event.organizer?.name[0].toUpperCase() ?? '?'}
                </div>
                <span className="text-xs font-medium" style={{ color: 'var(--ink-3)' }}>{event.organizer?.name}</span>
                <span className={`badge ml-auto ${STATUS_BADGE[event.status]}`}>{event.status}</span>
              </div>
              <h3 className="font-bold text-[15px] mb-1.5">{event.title}</h3>
              <p className="text-sm leading-relaxed mb-4 line-clamp-2" style={{ color: 'var(--ink-3)' }}>{event.description}</p>
              <div className="space-y-1.5">
                {[
                  { icon: MapPin, text: event.location },
                  { icon: Calendar, text: formatDate(event.start_date) },
                  { icon: Users, text: `${event.registration_count ?? 0} / ${event.max_participants} registered` },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-3)' }}>
                    <Icon className="w-3 h-3 flex-shrink-0" />{text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}