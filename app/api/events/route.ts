// Path: app/api/events/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const createdBy = searchParams.get('created_by')
  const status    = searchParams.get('status')
  const type      = searchParams.get('type')
  const search    = searchParams.get('search')?.toLowerCase()

  const supabase = createServerClient()

  let query = supabase
    .from('events')
    .select(`*, organizer:profiles!events_created_by_fkey(*)`)

  if (createdBy) query = query.eq('created_by', createdBy)
  if (status)    query = query.eq('status', status)
  if (type)      query = query.eq('type', type)
  if (search)    query = query.or(
    `title.ilike.%${search}%,description.ilike.%${search}%,location.ilike.%${search}%`
  )

  query = query.order('start_date', { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error('GET /api/events error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
    }

    const body = await req.json()

    // FIX: the DB constraint chk_team_size_only_for_team requires min/max_team_size
    // to be NULL for INDIVIDUAL events. The form may send 0, "", or even a real
    // number for these fields — so we force NULL explicitly based on type,
    // never trusting the form value for INDIVIDUAL events.
    const isTeamEvent = body.type === 'TEAM'

    const { data, error } = await supabase
      .from('events')
      .insert({
        title:                 body.title,
        description:           body.description ?? '',
        type:                  body.type,
        start_date:            body.start_date,
        end_date:              body.end_date,
        location:              body.location,
        max_participants:      body.max_participants,
        min_team_size:         isTeamEvent ? (body.min_team_size  || null) : null,
        max_team_size:         isTeamEvent ? (body.max_team_size  || null) : null,
        registration_deadline: body.registration_deadline,
        tags:                  body.tags        ?? [],
        cover_image:           body.cover_image ?? null,
        created_by:            user.id,   // always from session, never from body
        status:                'DRAFT',
      })
      .select(`*, organizer:profiles!events_created_by_fkey(*)`)
      .single()

    if (error) {
      console.error('POST /api/events error:', error)
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data, error: null, success: true }, { status: 201 })
  } catch (e: unknown) {
    console.error('POST /api/events exception:', e)
    return NextResponse.json({ data: null, error: 'Failed to create event', success: false }, { status: 500 })
  }
}