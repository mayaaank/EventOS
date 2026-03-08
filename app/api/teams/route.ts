import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { CreateTeamPayload } from '@/types'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const search = searchParams.get('search')?.toLowerCase()
  const skills = searchParams.get('skills')?.split(',').filter(Boolean)

  const supabase = createServerClient()

  // 1. Query against the pre-calculated team_details view
  let query = supabase.from('team_details').select('*')

  if (eventId) {
    query = query.eq('event_id', eventId)
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`)
  }

  if (skills && skills.length > 0) {
    query = query.contains('skills', skills)
  }

  const { data: teams, error } = await query

  if (error) {
    console.error("GET /api/teams error:", error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  if (!teams || teams.length === 0) {
    return NextResponse.json({ data: [], error: null, success: true })
  }

  // 2. Fetch all members for these teams
  const teamIds = teams.map(t => t.id)
  const { data: members, error: membersError } = await supabase
    .from('team_members')
    .select(`*, user:profiles!team_members_user_id_fkey(*)`)
    .in('team_id', teamIds)

  if (membersError) {
    console.error("GET /api/teams members error:", membersError)
    // Non-fatal, return teams without members if this fails
  }

  // 3. Attach the populated `members` arrays to their respective teams
  const teamsWithMembers = teams.map(team => ({
    ...team,
    members: members ? members.filter(m => m.team_id === team.id) : []
  }))

  return NextResponse.json({ data: teamsWithMembers, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
    }

    const body: CreateTeamPayload = await req.json()
    const { event_id, name, description, skills } = body

    // 1. Verify user is registered for the event
    const { data: reg, error: regError } = await supabase
      .from('registrations')
      .select('id, status')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .neq('status', 'CANCELLED')
      .single()

    if (regError || !reg) {
      return NextResponse.json({ data: null, error: 'You must be registered for this event to create a team.', success: false }, { status: 403 })
    }

    // 2. Insert team
    const { data, error } = await supabase
      .from('teams')
      .insert({
        event_id,
        name,
        description: description || null,
        skills: skills || [],
        leader_id: user.id
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ data: null, error: 'Team name already taken for this event', success: false }, { status: 409 })
      }
      console.error("POST /api/teams insert error:", error)
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data, error: null, success: true }, { status: 201 })
  } catch (e: unknown) {
    console.error("POST /api/teams exception:", e)
    return NextResponse.json({ data: null, error: 'Failed to create team', success: false }, { status: 500 })
  }
}