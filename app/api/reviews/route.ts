import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/reviews?event_id=<id>  — All reviews for an event
// GET /api/reviews?user_id=<id>   — All reviews by a user
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const eventId = searchParams.get('event_id')
  const userId = searchParams.get('user_id')

  const supabase = createServerClient()

  let query = supabase
    .from('reviews')
    .select('*, user:profiles!reviews_user_id_fkey(id, name, email, avatar_url)')
    .order('created_at', { ascending: false })

  if (eventId) query = query.eq('event_id', eventId)
  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query

  if (error) {
    console.error('GET /api/reviews error:', error)
    return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
  }

  return NextResponse.json({ data: data ?? [], error: null, success: true })
}

// POST /api/reviews — Submit or update a review (upsert)
// Body: { event_id, rating, comment? }
export async function POST(req: NextRequest) {
  try {
    const supabase = createServerClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ data: null, error: 'Unauthorized', success: false }, { status: 401 })
    }

    const { event_id, rating, comment } = await req.json()

    if (!event_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { data: null, error: 'event_id and rating (1-5) are required', success: false },
        { status: 400 }
      )
    }

    // Verify: event must be COMPLETED  
    const { data: event } = await supabase
      .from('events')
      .select('status')
      .eq('id', event_id)
      .single()

    if (!event || event.status !== 'COMPLETED') {
      return NextResponse.json(
        { data: null, error: 'Reviews can only be submitted for completed events', success: false },
        { status: 400 }
      )
    }

    // Verify: user must have been registered for this event
    const { data: reg } = await supabase
      .from('registrations')
      .select('id')
      .eq('event_id', event_id)
      .eq('user_id', user.id)
      .neq('status', 'CANCELLED')
      .single()

    if (!reg) {
      return NextResponse.json(
        { data: null, error: 'You must be registered for this event to leave a review', success: false },
        { status: 403 }
      )
    }

    // Upsert review
    const { data: review, error } = await supabase
      .from('reviews')
      .upsert(
        {
          event_id,
          user_id: user.id,
          rating,
          comment: comment || null,
        },
        { onConflict: 'event_id,user_id' }
      )
      .select('*, user:profiles!reviews_user_id_fkey(id, name, email, avatar_url)')
      .single()

    if (error) {
      console.error('POST /api/reviews error:', error)
      return NextResponse.json({ data: null, error: error.message, success: false }, { status: 500 })
    }

    return NextResponse.json({ data: review, error: null, success: true }, { status: 201 })
  } catch (e: unknown) {
    console.error('POST /api/reviews exception:', e)
    return NextResponse.json({ data: null, error: 'Failed to submit review', success: false }, { status: 500 })
  }
}
