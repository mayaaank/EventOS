import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { CreateJoinRequestPayload } from '@/types'

// GET /api/teams/requests?team_id=X         → requests for a team (leader view)
// GET /api/teams/requests?user_id=X         → requests by a user (participant view)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const teamId = searchParams.get('team_id')
  const userId = searchParams.get('user_id')

  const supabase = createServerClient()

  let query = supabase.from('team_join_requests').select(`*, user:profiles!team_join_requests_user_id_fkey(*), team:teams!team_join_requests_team_id_fkey(*)`)

  if (teamId) query = query.eq('team_id', teamId)
  if (userId) query = query.eq('user_id', userId)

  // Order: pending first
  query = query.order('status', { ascending: true }) // Enum order: PENDING, ACCEPTED, REJECTED
  query = query.order('created_at', { ascending: false })

  const { data: requests, error } = await query

  if (error) {
    console.error("GET /api/teams/requests error:", error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: requests, error: null, success: true })
}

// POST /api/teams/requests → participant sends a join request
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
    }

    const body: CreateJoinRequestPayload = await req.json()
    const { team_id, message } = body

    // 1. Fetch team metadata and check capacity implicitly
    const { data: teamDetails, error: tError } = await supabase
      .from('team_details')
      .select('member_count, max_size')
      .eq('id', team_id)
      .single()

    if (tError || !teamDetails) {
      return NextResponse.json({ data: null, error: 'Team not found', success: false }, { status: 404 })
    }

    if (teamDetails.member_count >= teamDetails.max_size) {
      return NextResponse.json({ data: null, error: 'Team is full', success: false }, { status: 400 })
    }

    // 2. Prevent joining if already a member
    const { data: tm } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', team_id)
      .eq('user_id', user.id)
      .single()

    if (tm) {
      return NextResponse.json({ data: null, error: 'Already a member of this team', success: false }, { status: 409 })
    }

    // 3. Insert the request (Unique constraint `uq_one_request_per_user_per_team` ensures only one pending/resolved request exists)
    const { data: newRequest, error } = await supabase
      .from('team_join_requests')
      .insert({
        team_id,
        user_id: user.id,
        message: message || null,
        status: 'PENDING'
      })
      .select(`*, user:profiles!team_join_requests_user_id_fkey(*), team:teams!team_join_requests_team_id_fkey(*)`)
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ data: null, error: 'You already have a request for this team', success: false }, { status: 409 })
      }
      console.error("POST /api/teams/requests insert error:", error)
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data: newRequest, error: null, success: true }, { status: 201 })
  } catch (e: unknown) {
    console.error("POST /api/teams/requests exception:", e)
    return NextResponse.json({ data: null, error: 'Failed to send request', success: false }, { status: 500 })
  }
}