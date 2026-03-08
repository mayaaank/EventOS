import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')

  const supabase = createServerClient()
  let query = supabase.from('check_ins').select('*')
  if (eventId) query = query.eq('event_id', eventId)

  const { data, error } = await query

  if (error) {
    console.error("GET /api/checkins error:", error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data, error: null, success: true })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()
    const { qr_token, event_id } = await req.json()

    // Authenticate the user checking others in (must be the organizer, enforced by Postgres RLS)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
    }

    // Find the registration by qr_token and event_id
    const { data: reg, error: regError } = await supabase
      .from('registrations')
      .select('id, status, checked_in')
      .eq('qr_token', qr_token)
      .eq('event_id', event_id)
      .single()

    if (regError || !reg) {
      return NextResponse.json({ data: null, error: 'Invalid QR token for this event', success: false }, { status: 404 })
    }

    if (reg.status === 'CANCELLED') {
      return NextResponse.json({ data: null, error: 'Registration is cancelled', success: false }, { status: 400 })
    }

    if (reg.checked_in) {
      return NextResponse.json({ data: null, error: 'Already checked in', success: false }, { status: 409 })
    }

    // Insert the check-in record. 
    // The Postgres trigger `fn_handle_checkin_inserted` will automatically update `registrations.checked_in`.
    const { data: checkin, error: checkinError } = await supabase
      .from('check_ins')
      .insert({
        registration_id: reg.id,
        event_id,
        checked_in_by: user.id
      })
      .select()
      .single()

    if (checkinError) {
      // 23505 is Postgres for unique violation
      if (checkinError.code === '23505') {
        return NextResponse.json({ data: null, error: 'Already checked in', success: false }, { status: 409 })
      }
      console.error("POST /api/checkins insert error:", checkinError)
      return NextResponse.json({ data: null, error: checkinError.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data: checkin, error: null, success: true }, { status: 201 })
  } catch (e: unknown) {
    console.error("POST /api/checkins exception:", e)
    return NextResponse.json({ data: null, error: 'Check-in failed', success: false }, { status: 500 })
  }
}