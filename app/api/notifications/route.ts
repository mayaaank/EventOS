// Path: app/api/notifications/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

// GET /api/notifications?user_id=
// Returns all notifications for the current user, newest first.
// Also returns unread_count so the client doesn't need a second request.
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('user_id')

        if (!userId) {
            return NextResponse.json(
                { data: null, error: 'user_id is required', success: false },
                { status: 400 }
            )
        }

        const supabase = createServerClient()

        // RLS policy "notif_select_own" ensures users only see their own notifications
        const { data, error } = await supabase
            .from('notifications')
            .select('id, user_id, title, message, type, category, read, action_url, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50) // cap at 50 — add pagination if needed later

        if (error) {
            console.error('[GET /api/notifications] error:', error)
            return NextResponse.json(
                { data: null, error: error.message, success: false },
                { status: 500 }
            )
        }

        const unread_count = (data ?? []).filter(n => !n.read).length

        return NextResponse.json({
            data,
            unread_count,
            error: null,
            success: true,
        })
    } catch (err) {
        console.error('[GET /api/notifications] unexpected error:', err)
        return NextResponse.json(
            { data: null, error: 'Failed to fetch notifications', success: false },
            { status: 500 }
        )
    }
}