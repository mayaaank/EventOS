// Path: app/api/teams/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/teams/[id]
// Returns a single team with members array attached.
// Used by: teamsService.getById()

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()

    // Fetch team from team_details view (includes member_count, pending_requests)
    const { data: team, error: teamError } = await supabase
      .from('team_details')
      .select(`
        id, event_id, name, description, status,
        leader_id, skills, max_size,
        created_at, updated_at,
        member_count, pending_requests
      `)
      .eq('id', params.id)
      .single()

    if (teamError || !team) {
      if (teamError?.code === 'PGRST116') {
        return NextResponse.json(
          { data: null, error: 'Team not found', success: false },
          { status: 404 }
        )
      }
      return NextResponse.json(
        { data: null, error: teamError?.message ?? 'Failed to fetch team', success: false },
        { status: 500 }
      )
    }

    // Fetch members with profile info in one query
    const { data: members, error: membersError } = await supabase
      .from('team_members')
      .select(`
        id, team_id, user_id, role, joined_at,
        user:profiles (
          id, name, email, avatar_url
        )
      `)
      .eq('team_id', params.id)

    if (membersError) {
      console.error('[GET /api/teams/[id]] members error:', membersError)
      return NextResponse.json(
        { data: null, error: membersError.message, success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: { ...team, members: members ?? [] },
      error: null,
      success: true,
    })
  } catch (err) {
    console.error('[GET /api/teams/[id]] unexpected error:', err)
    return NextResponse.json(
      { data: null, error: 'Failed to fetch team', success: false },
      { status: 500 }
    )
  }
}