// Path: app/api/notifications/announce/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'

// POST /api/notifications/announce
// Body: { event_id, title, message }
// Sends a notification to every confirmed registrant of an event.
// Only the event organizer can call this.
// Uses service role client to INSERT notifications (bypasses RLS for bulk insert).
export async function POST(req: NextRequest) {
    try {
        const { event_id, title, message } = await req.json()

        if (!event_id || !title || !message) {
            return NextResponse.json(
                { data: null, error: 'event_id, title and message are required', success: false },
                { status: 400 }
            )
        }

        // Verify the caller is the event organizer using the user-scoped client
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { data: null, error: 'Unauthorized', success: false },
                { status: 401 }
            )
        }

        const { data: event, error: eventError } = await supabase
            .from('events')
            .select('id, title, created_by')
            .eq('id', event_id)
            .single()

        if (eventError || !event) {
            return NextResponse.json(
                { data: null, error: 'Event not found', success: false },
                { status: 404 }
            )
        }

        if (event.created_by !== user.id) {
            return NextResponse.json(
                { data: null, error: 'Only the event organizer can send announcements', success: false },
                { status: 403 }
            )
        }

        // Fetch all confirmed registrants for this event
        const { data: registrations, error: regError } = await supabase
            .from('registrations')
            .select('user_id')
            .eq('event_id', event_id)
            .eq('status', 'CONFIRMED')

        if (regError || !registrations?.length) {
            return NextResponse.json(
                { data: null, error: 'No confirmed registrants found', success: false },
                { status: 404 }
            )
        }

        // Build notification rows for all participants
        const notifications = registrations.map(r => ({
            user_id: r.user_id,
            title,
            message,
            type: 'INFO' as const,
            category: 'EVENT' as const,
            read: false,
            action_url: `/participant`,
        }))

        // Use service role to bypass RLS for bulk insert
        // (RLS only allows users to read their own notifications, not insert)
        const serviceClient = createServiceClient()
        const { error: insertError } = await serviceClient
            .from('notifications')
            .insert(notifications)

        if (insertError) {
            console.error('[POST /api/notifications/announce] insert error:', insertError)
            return NextResponse.json(
                { data: null, error: insertError.message, success: false },
                { status: 500 }
            )
        }

        return NextResponse.json({
            data: { sent_to: notifications.length },
            error: null,
            success: true,
        })
    } catch (err) {
        console.error('[POST /api/notifications/announce] unexpected error:', err)
        return NextResponse.json(
            { data: null, error: 'Failed to send announcement', success: false },
            { status: 500 }
        )
    }
}