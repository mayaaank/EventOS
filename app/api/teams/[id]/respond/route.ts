import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// POST /api/teams/[id]/respond
// Body: { request_id, response: 'ACCEPTED' | 'REJECTED' }
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { request_id, response } = await req.json()

    // Validate request body
    if (!['ACCEPTED', 'REJECTED'].includes(response)) {
      return NextResponse.json({ data: null, error: 'Invalid response status', success: false }, { status: 400 })
    }

    // RLS `req_update_leader` guarantees that only the leader of the team can execute this update.
    // The massive block of code previously here (checking capacity, injecting team_members, updating registrations, auto-rejecting others...)
    // is now 100% handled seamlessly by the Postgres AFTER UPDATE trigger `fn_handle_join_request_accepted`. 
    const { data: request, error } = await supabase
      .from('team_join_requests')
      .update({ status: response })
      .eq('id', request_id)
      .eq('team_id', params.id)
      .eq('status', 'PENDING') // Ensure it hasn't been resolved already
      .select(`*, user:profiles!team_join_requests_user_id_fkey(*), team:teams!team_join_requests_team_id_fkey(*)`)
      .single()

    if (error || !request) {
      if (error?.code === 'PGRST116') {
        return NextResponse.json({ data: null, error: 'Request not found, already resolved, or unauthorized', success: false }, { status: 404 })
      }
      console.error("POST /api/teams/[id]/respond error:", error)
      return NextResponse.json({ data: null, error: error?.message || 'Update failed', success: false }, { status: 500 })
    }

    // The trigger might have overridden our ACCEPTED to REJECTED if the team became full
    // just before this transaction completed. We can detect and report that gracefully.
    if (response === 'ACCEPTED' && request.status === 'REJECTED') {
      return NextResponse.json({ data: null, error: 'Team is now full. Request auto-rejected.', success: false }, { status: 400 })
    }

    return NextResponse.json({ data: request, error: null, success: true })
  } catch (e: unknown) {
    console.error("POST /api/teams/[id]/respond exception:", e)
    return NextResponse.json({ data: null, error: 'Failed to respond', success: false }, { status: 500 })
  }
}